module Insights
  # Organisation-wide headline numbers (active employees, USD reference rates).
  module Summary
    def self.call
      active = Employee.active.pluck(:currency, :annual_salary)
      usd_values = active.map { |currency, salary| CurrencyRates.to_usd(salary, currency) }
      { headcount: active.size, total_payroll_usd: usd_values.sum,
        usd: Statistics.call(usd_values).slice(:min, :median, :avg, :max) }
    end
  end
end
