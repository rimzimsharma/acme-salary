class EmployeeSearch
  FILTERS = %i[country department job_title seniority].freeze

  Result = Struct.new(:records, :page, :per_page, :total, keyword_init: true)

  def initialize(params = {})
    @params = params.to_h.with_indifferent_access
  end

  def call
    Result.new(records: by_text(by_filters(by_status(Employee.all))))
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
