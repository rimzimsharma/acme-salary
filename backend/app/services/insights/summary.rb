module Insights
  # Organisation-wide headline numbers (active employees, USD reference rates).
  module Summary
    def self.call
      active = Employee.active.pluck(:country, :currency, :annual_salary)
      usd_values = active.map { |_, currency, salary| CurrencyRates.to_usd(salary, currency) }
      { headcount: active.size, inactive_count: Employee.inactive.count,
        countries: active.map(&:first).uniq.size, total_payroll_usd: usd_values.sum,
        usd: Statistics.call(usd_values).slice(:min, :median, :avg, :max) }
    end
  end
end
