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

  test "flags someone paid far below their peers" do
    low = group_with(50_000)
    found = Insights::Outliers.call.first
    assert_equal [low.id, :below, -50], [found[:id], found[:direction], found[:deviation_pct]]
  end

  test "does not flag normal variation" do
    group_with(115_000)
    group_with(75_000, job_title: "Recruiter")
    assert_empty Insights::Outliers.call
  end

  test "ignores peer groups too small to judge" do
    3.times { create_employee(PEER_ATTRS.merge(annual_salary: 100_000)) }
    create_employee(PEER_ATTRS.merge(annual_salary: 300_000))
    assert_empty Insights::Outliers.call
  end

  test "peers must share country, title and seniority" do
    group_with(100_000)
    create_employee(PEER_ATTRS.merge(country: "India", currency: "INR", annual_salary: 8_300_000)) # alone in India
    create_employee(PEER_ATTRS.merge(seniority: "senior", annual_salary: 400_000)) # alone at senior
    assert_empty Insights::Outliers.call
  end

  test "people who have left are neither judged nor used as peers" do
    group_with(200_000).deactivate!
    assert_empty Insights::Outliers.call
  end
end
