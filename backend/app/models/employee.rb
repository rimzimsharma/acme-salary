class Employee < ApplicationRecord
  CURRENCIES = %w[USD EUR GBP INR CAD AUD JPY].freeze
  SENIORITIES = %w[junior mid senior lead executive].freeze

  before_validation :normalize_email

  validates :full_name, :job_title, :department, :country, presence: true
  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
                    uniqueness: { case_sensitive: false }
  validates :currency, presence: true, inclusion: { in: CURRENCIES, allow_blank: true }
  validates :seniority, presence: true, inclusion: { in: SENIORITIES, allow_blank: true }
  validates :annual_salary, presence: true,
                            numericality: { only_integer: true, greater_than: 0, allow_nil: true }
  validates :hire_date, presence: true
  validate :hire_date_not_in_future

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  def deactivate!
    update!(active: false)
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end

  def hire_date_not_in_future
    errors.add(:hire_date, "cannot be in the future") if hire_date.present? && hire_date > Date.current
  end
end
