module Insights
  # Pay statistics grouped by one dimension. Salaries in different currencies are
  # compared through fixed USD reference rates; groups that happen to use a single
  # currency additionally report their figures in that local currency.
  class Breakdown
    DIMENSIONS = %w[country department job_title seniority].freeze

    def self.call(by:, filters: {})
      new(by, filters).call
    end

    def initialize(by, filters)
      raise ArgumentError, "unknown grouping: #{by.inspect}" unless DIMENSIONS.include?(by.to_s)

      @by = by.to_s
      @filters = filters.to_h.with_indifferent_access.slice(*DIMENSIONS).compact_blank
    end

    def call
      rows = Employee.active.where(@filters).pluck(@by, :currency, :annual_salary)
      rows.group_by(&:first)
          .map { |key, members| summarize(key, members) }
          .sort_by { |group| [ -group[:headcount], group[:key].to_s ] }
    end

    private

    def summarize(key, members)
      usd_values = members.map { |_, currency, salary| CurrencyRates.to_usd(salary, currency) }
      usd = Statistics.call(usd_values)
      { key: key, headcount: members.size,
        usd: usd.slice(:min, :median, :avg, :max).merge(total: usd_values.sum),
        local: local_figures(members) }
    end

    def local_figures(members)
      currencies = members.map { |_, currency, _| currency }.uniq
      return unless currencies.one?

      { currency: currencies.first }.merge(Statistics.call(members.map(&:last)).slice(:min, :median, :avg, :max))
    end
  end
end
