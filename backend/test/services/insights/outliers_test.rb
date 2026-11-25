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

  test "most extreme first, capped by limit" do
    group_with(160_000)                              # +60%
    group_with(250_000, job_title: "Recruiter")      # +150%
    group_with(30_000, job_title: "Accountant")      # -70%
    all = Insights::Outliers.call
    assert_equal [250_000, 30_000, 160_000], all.map { |r| r[:salary_usd] }
    assert_equal [250_000], Insights::Outliers.call(limit: 1).map { |r| r[:salary_usd] }
  end

  test "each outlier carries enough detail to display without another lookup" do
    group_with(200_000, job_title: "Software Engineer")
    row = Insights::Outliers.call.first
    employee = Employee.find(row[:id])
    assert_equal [employee.full_name, employee.job_title, employee.country, employee.seniority, "USD", 200_000],
                 row.values_at(:full_name, :job_title, :country, :seniority, :currency, :annual_salary)
  end
end
