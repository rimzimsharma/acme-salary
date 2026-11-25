module Insights
  # Employees paid far from the median of their peers (same country, title and seniority).
  module Outliers
    HIGH = 1.4
    LOW = 0.7
    MIN_PEERS = 5 # smaller groups have no meaningful 'typical' pay

    DEFAULT_LIMIT = 50

    def self.call(limit: DEFAULT_LIMIT)
      flagged = Employee.active.group_by { |e| [e.country, e.job_title, e.seniority] }.values.flat_map do |peers|
        next [] if peers.size < MIN_PEERS

        usd = peers.to_h { |e| [e, CurrencyRates.to_usd(e.annual_salary, e.currency)] }
        median = Statistics.call(usd.values)[:median]
        usd.filter_map do |employee, salary|
          next unless salary > median * HIGH || salary < median * LOW

          { id: employee.id, full_name: employee.full_name, job_title: employee.job_title,
            country: employee.country, seniority: employee.seniority, currency: employee.currency,
            annual_salary: employee.annual_salary, salary_usd: salary, peer_median_usd: median, direction: salary > median ? :above : :below,
            deviation_pct: ((salary - median) * 100.0 / median).round }
        end
      end
      flagged.sort_by { |row| -row[:deviation_pct].abs }.first(limit)
    end
  end
end
