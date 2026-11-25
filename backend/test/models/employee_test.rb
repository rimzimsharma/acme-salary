require "test_helper"

class EmployeeTest < ActiveSupport::TestCase
  def build(overrides = {})
    Employee.new({
      full_name: "Asha Rao",
      email: "asha.rao@acme.test",
      job_title: "Software Engineer",
      department: "Engineering",
      country: "India",
      currency: "INR",
      annual_salary: 2_400_000,
      seniority: "mid",
      hire_date: Date.new(2021, 6, 1)
    }.merge(overrides))
  end

  test "a fully populated employee is valid and active by default" do
    employee = build
    assert employee.valid?, employee.errors.full_messages.to_sentence
    assert employee.active?
  end

  %i[full_name email job_title department country currency annual_salary seniority hire_date].each do |field|
    test "#{field} is required" do
      employee = build(field => nil)
      assert_not employee.valid?
      assert_includes employee.errors[field], "can't be blank"
    end
  end

  test "email must look like an email" do
    assert_not build(email: "not-an-email").valid?
  end

  test "email is unique regardless of case" do
    build.save!
    duplicate = build(email: "ASHA.RAO@acme.test", full_name: "Someone Else")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email], "has already been taken"
  end

  test "email is stored lowercased and stripped" do
    employee = build(email: "  Asha.Rao@Acme.Test ")
    employee.valid?
    assert_equal "asha.rao@acme.test", employee.email
  end

  test "annual_salary must be a positive whole number" do
    assert_not build(annual_salary: 0).valid?
    assert_not build(annual_salary: -5).valid?
    assert_not build(annual_salary: 1000.5).valid?
  end

  test "currency must be one we support" do
    assert_not build(currency: "XYZ").valid?
    Employee::CURRENCIES.each { |code| assert build(currency: code).valid?, "#{code} should be valid" }
  end

  test "seniority must be a known level" do
    assert_not build(seniority: "wizard").valid?
    Employee::SENIORITIES.each { |level| assert build(seniority: level).valid?, "#{level} should be valid" }
  end

  test "hire_date cannot be in the future" do
    assert_not build(hire_date: Date.current + 1).valid?
    assert build(hire_date: Date.current).valid?
  end

  test "deactivate! flags the employee inactive without deleting the row" do
    employee = build
    employee.save!
    employee.deactivate!
    assert_not employee.reload.active?
    assert_equal 1, Employee.count
  end

  test "active and inactive scopes split on the flag" do
    kept = build.tap(&:save!)
    gone = build(email: "gone@acme.test").tap(&:save!)
    gone.deactivate!
    assert_equal [kept], Employee.active.to_a
    assert_equal [gone], Employee.inactive.to_a
  end
end
