module Insights
  # Employees paid far from the median of their peers (same country, title and seniority).
  module Outliers
    HIGH = 1.4

    def self.call
      Employee.active.group_by { |e| [e.country, e.job_title, e.seniority] }.values.flat_map do |peers|
        usd = peers.to_h { |e| [e, CurrencyRates.to_usd(e.annual_salary, e.currency)] }
        median = Statistics.call(usd.values)[:median]
        usd.filter_map do |employee, salary|
          next unless salary > median * HIGH

          { id: employee.id, salary_usd: salary, peer_median_usd: median, direction: :above,
            deviation_pct: ((salary - median) * 100.0 / median).round }
        end
      end
    end
  end
end
