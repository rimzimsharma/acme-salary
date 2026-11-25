module Seeding
  # Deterministic synthetic workforce. The same seed and `today` always give the
  # same rows, so tests and demos are reproducible.
  class EmployeeGenerator
    include Enumerable

    COUNTRIES = {
      # pay: typical pay relative to the US; round: salary rounding step in local currency
      "United States"  => { currency: "USD", weight: 30, pay: 1.0,  round: 1_000 },
      "India"          => { currency: "INR", weight: 22, pay: 0.25, round: 10_000 },
      "United Kingdom" => { currency: "GBP", weight: 12, pay: 0.8,  round: 500 },
      "Germany"        => { currency: "EUR", weight: 12, pay: 0.85, round: 500 },
      "Canada"         => { currency: "CAD", weight: 8,  pay: 0.85, round: 1_000 },
      "Australia"      => { currency: "AUD", weight: 8,  pay: 0.9,  round: 1_000 },
      "Japan"          => { currency: "JPY", weight: 8,  pay: 0.7,  round: 100_000 }
    }.freeze

    DEPARTMENTS = {
      # titles map to a mid-level US base salary in USD
      "Engineering" => { weight: 35, titles: { "Software Engineer" => 95_000, "QA Engineer" => 75_000, "DevOps Engineer" => 100_000, "Data Engineer" => 105_000 } },
      "Sales"       => { weight: 18, titles: { "Account Executive" => 80_000, "Sales Manager" => 110_000, "Sales Development Rep" => 55_000 } },
      "Marketing"   => { weight: 9,  titles: { "Marketing Specialist" => 65_000, "Content Strategist" => 60_000 } },
      "HR"          => { weight: 5,  titles: { "HR Generalist" => 60_000, "Recruiter" => 58_000 } },
      "Finance"     => { weight: 8,  titles: { "Accountant" => 70_000, "Financial Analyst" => 80_000 } },
      "Operations"  => { weight: 15, titles: { "Operations Analyst" => 65_000, "Support Specialist" => 48_000 } },
      "Product"     => { weight: 10, titles: { "Product Manager" => 120_000, "Designer" => 85_000 } }
    }.freeze

    SENIORITIES = {
      "junior" => { weight: 25, multiplier: 0.7 }, "mid" => { weight: 35, multiplier: 1.0 },
      "senior" => { weight: 25, multiplier: 1.35 }, "lead" => { weight: 11, multiplier: 1.7 },
      "executive" => { weight: 4, multiplier: 2.5 }
    }.freeze

    NOISE = (0.88..1.12) # individual variation around the band
    ACTIVE_SHARE = 0.94
    OUTLIER_SHARE = 0.01
    OUTLIER_FACTORS = [ 0.5, 1.8 ].freeze # paid far below / far above peers

    FIRST_NAMES = %w[Aarav Priya Rohan Ananya Vikram Neha Arjun Kavya Liam Olivia Noah Emma Oliver Amelia
                     James Sophia Lucas Mia Ethan Chloe Hana Kenji Yuki Sakura Hiro Lena Jonas Greta Felix Marta
                     Mateo Sofia Daniel Grace Samuel Zoe Ravi Isha Tom Ella].freeze
    LAST_NAMES = %w[Sharma Patel Singh Rao Iyer Gupta Reddy Nair Smith Johnson Brown Taylor Wilson Clark Walker
                    Hall Young King Wright Scott Tanaka Sato Suzuki Watanabe Muller Schmidt Fischer Weber
                    Wagner Becker Martin Roy Tremblay Campbell Stewart Evans Hughes Morgan Cooper Reed Bailey].freeze

    def initialize(count:, seed: 42, today: Date.current)
      @count = count
      @seed = seed
      @today = today
    end

    def each
      return enum_for(:each) unless block_given?

      rng = Random.new(@seed)
      @count.times { |i| yield build_row(i, rng) }
    end

    private

    def build_row(index, rng)
      country = weighted(rng, COUNTRIES.transform_values { |c| c[:weight] })
      department = weighted(rng, DEPARTMENTS.transform_values { |d| d[:weight] })
      first = FIRST_NAMES.sample(random: rng)
      last = LAST_NAMES.sample(random: rng)
      title = DEPARTMENTS.fetch(department)[:titles].keys.sample(random: rng)
      seniority = weighted(rng, SENIORITIES.transform_values { |s| s[:weight] })
      outlier = rng.rand < OUTLIER_SHARE

      {
        full_name: "#{first} #{last}",
        # The sequence number guarantees uniqueness at any scale.
        email: "#{first}.#{last}.#{index + 1}@acme.example".downcase,
        job_title: title,
        department: department,
        country: country,
        currency: COUNTRIES.fetch(country)[:currency],
        annual_salary: salary(rng, country:, department:, title:, seniority:, outlier:),
        seniority: seniority,
        hire_date: @today - rng.rand(0..(12 * 365)),
        active: rng.rand < ACTIVE_SHARE,
        outlier: outlier # test/insight marker only; stripped before insert
      }
    end

    def salary(rng, country:, department:, title:, seniority:, outlier:)
      info = COUNTRIES.fetch(country)
      usd = DEPARTMENTS.fetch(department)[:titles].fetch(title) *
            SENIORITIES.fetch(seniority)[:multiplier] * info[:pay] * rng.rand(NOISE)
      usd *= OUTLIER_FACTORS.sample(random: rng) if outlier
      local = usd * CurrencyRates::PER_USD.fetch(info[:currency])
      [ (local / info[:round]).round * info[:round], info[:round] ].max
    end

    def weighted(rng, weights)
      roll = rng.rand(weights.values.sum)
      weights.each do |key, weight|
        return key if roll < weight
        roll -= weight
      end
    end
  end
end
