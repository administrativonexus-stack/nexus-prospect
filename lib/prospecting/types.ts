export interface ScrapedCompany {
  company_name: string
  phone: string | null
  website: string | null
  address: string | null
  rating: number | null
  review_count: number
  niche: string
  city: string
}
