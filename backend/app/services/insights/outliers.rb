module Insights
  # Employees paid far from the median of their peers (same country, title and seniority).
  module Outliers
    HIGH = 1.4
    LOW = 0.7
    MIN_PEERS = 5 # smaller groups have no meaningful 'typical' pay

    def self.call
      Employee.active.group_by { |e| [e.country, e.job_title, e.seniority] }.values.flat_map do |peers|
        next [] if peers.size < MIN_PEERS

        usd = peers.to_h { |e| [e, CurrencyRates.to_usd(e.annual_salary, e.currency)] }
        median = Statistics.call(usd.values)[:median]
        usd.filter_map do |employee, salary|
          next unless salary > median * HIGH || salary < median * LOW

          { id: employee.id, salary_usd: salary, peer_median_usd: median, direction: salary > median ? :above : :below,
            deviation_pct: ((salary - median) * 100.0 / median).round }
        end
      end
    end
  end
end
