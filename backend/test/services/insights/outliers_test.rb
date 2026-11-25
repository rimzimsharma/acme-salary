require "test_helper"

class Insights::OutliersTest < ActiveSupport::TestCase
  PEER_ATTRS = { country: "United States", currency: "USD", job_title: "Software Engineer", seniority: "mid" }.freeze

  # Five peers at 100k plus one person at the given salary (6 people, median 100k).
  def group_with(salary, extra_attrs = {})
    5.times { create_employee(PEER_ATTRS.merge(extra_attrs).merge(annual_salary: 100_000)) }
    create_employee(PEER_ATTRS.merge(extra_attrs).merge(annual_salary: salary))
  end

  test "flags someone paid far above their peers" do
    high = group_with(200_000)
    found = Insights::Outliers.call.first
    assert_equal high.id, found[:id]
    assert_equal :above, found[:direction]
    assert_equal [200_000, 100_000, 100], [found[:salary_usd], found[:peer_median_usd], found[:deviation_pct]]
  end
end
