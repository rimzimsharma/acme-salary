module Insights
  # Summary figures for a list of whole-number salaries. Averages and medians are
  # rounded to whole units; halves round up. Median (not just average) is reported
  # because a few very high salaries drag an average away from "typical" pay.
  module Statistics
    EMPTY = { min: nil, median: nil, avg: nil, max: nil, count: 0 }.freeze

    def self.call(values)
      return EMPTY if values.empty?

      sorted = values.sort
      { min: sorted.first, median: median(sorted), avg: (sorted.sum.to_f / sorted.size).round,
        max: sorted.last, count: sorted.size }
    end

    def self.median(sorted)
      mid = sorted.size / 2
      return sorted[mid] if sorted.size.odd?

      ((sorted[mid - 1] + sorted[mid]) / 2.0).round
    end
    private_class_method :median
  end
end
