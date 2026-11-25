class EmployeeSearch
  FILTERS = %i[country department job_title seniority].freeze
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  SORTABLE = %w[full_name annual_salary hire_date country department seniority job_title].freeze

  Result = Struct.new(:records, :page, :per_page, :total, keyword_init: true)

  def initialize(params = {})
    @params = params.to_h.with_indifferent_access
  end

  def call
    matches = by_text(by_filters(by_status(Employee.all)))
    Result.new(
      records: ordered(matches).limit(per_page).offset((page - 1) * per_page),
      page: page, per_page: per_page, total: matches.count
    )
  end

  private

  # Case-insensitive substring match on name or email. LIKE wildcards in user
  # input are escaped so "100%" means a literal percent sign.
  def by_text(scope)
    q = @params[:q].to_s.strip
    return scope if q.empty?

    pattern = "%#{Employee.sanitize_sql_like(q.downcase)}%"
    scope.where("LOWER(full_name) LIKE :p ESCAPE '\\' OR LOWER(email) LIKE :p ESCAPE '\\'", p: pattern)
  end

  def page
    @page ||= [ @params[:page].to_i, 1 ].max
  end

  def per_page
    @per_page ||= begin
      requested = @params[:per_page].to_i
      requested.positive? ? [ requested, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE
    end
  end

  # Only whitelisted columns reach ORDER BY; id breaks ties so paging is stable.
  def ordered(scope)
    column = SORTABLE.include?(@params[:sort].to_s) ? @params[:sort].to_s : "full_name"
    direction = @params[:dir].to_s.downcase == "desc" ? :desc : :asc
    scope.order(column => direction, id: :asc)
  end

  def by_filters(scope)
    FILTERS.reduce(scope) do |relation, field|
      value = @params[field]
      value.present? ? relation.where(field => value) : relation
    end
  end

  def by_status(scope)
    case @params[:status]
    when "inactive" then scope.inactive
    when "all" then scope
    else scope.active
    end
  end
end
