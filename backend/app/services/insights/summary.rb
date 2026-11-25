module Insights
  # Organisation-wide headline numbers (active employees, USD reference rates).
  module Summary
    def self.call
      active = Employee.active.pluck(:currency, :annual_salary)
      { headcount: active.size,
        total_payroll_usd: active.sum { |currency, salary| CurrencyRates.to_usd(salary, currency) } }
    end
  end
end
