require "test_helper"

class Insights::StatisticsTest < ActiveSupport::TestCase
  test "min and max of the values" do
    stats = Insights::Statistics.call([ 30, 10, 20 ])
    assert_equal [ 10, 30 ], [ stats[:min], stats[:max] ]
  end

  test "average is rounded to a whole number" do
    assert_equal 20, Insights::Statistics.call([ 10, 20, 30 ])[:avg]
    assert_equal 2, Insights::Statistics.call([ 1, 2, 2 ])[:avg] # 1.67 rounds to 2
    assert_equal 2, Insights::Statistics.call([ 1, 2 ])[:avg] # 1.5: halves round up
  end

  test "median of an odd count is the middle value, regardless of input order" do
    assert_equal 30, Insights::Statistics.call([ 90, 10, 30, 70, 20 ])[:median]
  end

  test "median of an even count is the mean of the two middle values" do
    assert_equal 25, Insights::Statistics.call([ 40, 10, 20, 30 ])[:median]
    assert_equal 16, Insights::Statistics.call([ 10, 21 ])[:median] # 15.5: halves round up
  end

  test "a single value is its own min, median, avg and max" do
    assert_equal({ min: 5, median: 5, avg: 5, max: 5, count: 1 }, Insights::Statistics.call([ 5 ]))
  end

  test "an empty list gives nil figures and a zero count instead of raising" do
    assert_equal({ min: nil, median: nil, avg: nil, max: nil, count: 0 }, Insights::Statistics.call([]))
  end
end
