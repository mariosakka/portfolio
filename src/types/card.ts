export interface CardLink {
  label: string
  url: string
}

// What a section hands to CardList / ItemCard.
export interface CardItem {
  title: string
  subtitle?: string
  period?: string
  image?: string
  tags?: string[]
  links?: CardLink[]
  bud?: boolean
  detail?: string
}
