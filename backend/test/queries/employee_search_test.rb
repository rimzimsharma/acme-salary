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
end
