module Insights
  # Employees paid far from the median of their peers (same country, title and seniority).
  module Outliers
    HIGH = 1.4
    LOW = 0.7
    MIN_PEERS = 5 # smaller groups have no meaningful 'typical' pay

    DEFAULT_LIMIT = 50

    def self.call(limit: DEFAULT_LIMIT)
      rows = peer_groups.flat_map { |peers| outliers_in(peers) }
      rows.sort_by { |row| -row[:deviation_pct].abs }.first(limit)
    end

    def self.peer_groups
      Employee.active
              .group_by { |e| [ e.country, e.job_title, e.seniority ] }
              .values
              .select { |peers| peers.size >= MIN_PEERS }
    end

    def self.outliers_in(peers)
      salaries = peers.to_h { |e| [ e, CurrencyRates.to_usd(e.annual_salary, e.currency) ] }
      median = Statistics.call(salaries.values)[:median]
      salaries.filter_map { |employee, salary| row_for(employee, salary, median) if outlier?(salary, median) }
    end

    def self.outlier?(salary, median)
      salary > median * HIGH || salary < median * LOW
    end

    def self.row_for(employee, salary, median)
      {
        id: employee.id, full_name: employee.full_name, job_title: employee.job_title,
        country: employee.country, seniority: employee.seniority,
        currency: employee.currency, annual_salary: employee.annual_salary,
        salary_usd: salary, peer_median_usd: median,
        direction: salary > median ? :above : :below,
        deviation_pct: ((salary - median) * 100.0 / median).round
      }
    end

    private_class_method :peer_groups, :outliers_in, :outlier?, :row_for
  end
end
