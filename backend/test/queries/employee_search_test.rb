require "test_helper"

class EmployeeSearchTest < ActiveSupport::TestCase
  def search(params = {})
    EmployeeSearch.new(params).call
  end

  test "shows only active employees by default" do
    active = create_employee
    create_employee.deactivate!
    assert_equal [active], search.records.to_a
  end

  test "status param switches between inactive and all" do
    active = create_employee
    left = create_employee.tap(&:deactivate!)
    assert_equal [left], search(status: "inactive").records.to_a
    assert_equal [active, left].sort_by(&:id), search(status: "all").records.sort_by(&:id)
  end

  test "filters by country, department, job title and seniority" do
    target = create_employee(country: "Japan", currency: "JPY", department: "Sales", job_title: "Sales Manager", seniority: "lead")
    create_employee(country: "India")
    create_employee(department: "HR")
    create_employee(job_title: "Recruiter")
    create_employee(seniority: "junior")
    assert_equal [target], search(country: "Japan").records.to_a
    assert_equal [target], search(department: "Sales").records.to_a
    assert_equal [target], search(job_title: "Sales Manager").records.to_a
    assert_equal [target], search(seniority: "lead").records.to_a
  end

  test "filters combine with AND and blank values are ignored" do
    match = create_employee(country: "India", seniority: "senior")
    create_employee(country: "India", seniority: "junior")
    create_employee(country: "Japan", currency: "JPY", seniority: "senior")
    assert_equal [match], search(country: "India", seniority: "senior", department: "").records.to_a
  end

  test "q matches name or email, case-insensitively, as a substring" do
    asha = create_employee(full_name: "Asha Rao", email: "asha.rao@acme.test")
    ravi = create_employee(full_name: "Ravi Menon", email: "r.menon@acme.test")
    assert_equal [asha], search(q: "ASHA").records.to_a
    assert_equal [ravi], search(q: "menon@").records.to_a
    assert_equal [asha, ravi].sort_by(&:id), search(q: "a").records.sort_by(&:id)
  end

  test "q treats % and _ literally rather than as wildcards" do
    create_employee(full_name: "Plain Name")
    literal = create_employee(full_name: "100% Real_Name", email: "pct@acme.test")
    assert_equal [literal], search(q: "100%").records.to_a
    assert_equal [literal], search(q: "l_N").records.to_a
  end

  test "sorts by full_name ascending by default" do
    b = create_employee(full_name: "Bela")
    a = create_employee(full_name: "Anil")
    assert_equal [a, b], search.records.to_a
  end

  test "sort and dir params reorder results" do
    low = create_employee(annual_salary: 1_000_000)
    high = create_employee(annual_salary: 3_000_000)
    assert_equal [high, low], search(sort: "annual_salary", dir: "desc").records.to_a
    assert_equal [low, high], search(sort: "annual_salary", dir: "asc").records.to_a
  end

  test "unknown sort column or direction falls back safely instead of reaching SQL" do
    a = create_employee(full_name: "Anil")
    b = create_employee(full_name: "Bela")
    assert_equal [a, b], search(sort: "email; DROP TABLE employees", dir: "sideways").records.to_a
    assert_equal 2, Employee.count
  end

  test "paginates with page and per_page and reports totals" do
    7.times { |i| create_employee(full_name: format("Name %02d", i)) }
    result = search(page: 2, per_page: 3)
    assert_equal ["Name 03", "Name 04", "Name 05"], result.records.map(&:full_name)
    assert_equal [2, 3, 7], [result.page, result.per_page, result.total]
  end

  test "defaults to page 1 with 25 per page" do
    result = search
    assert_equal [1, 25], [result.page, result.per_page]
  end

  test "per_page is capped at 100 and bad values fall back to defaults" do
    assert_equal 100, search(per_page: 5_000).per_page
    assert_equal 25, search(per_page: "abc").per_page
    assert_equal 25, search(per_page: 0).per_page
    assert_equal 1, search(page: -4).page
    assert_equal 1, search(page: "x").page
  end

  test "a page past the end is empty, not an error" do
    create_employee
    assert_empty search(page: 9).records.to_a
  end

  test "total counts all matches, not just the current page" do
    4.times { create_employee(country: "Japan", currency: "JPY") }
    create_employee
    assert_equal 4, search(country: "Japan", per_page: 2).total
  end
end
