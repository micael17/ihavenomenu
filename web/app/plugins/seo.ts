export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'I Have No Menu',
          url: 'https://ihavenomenu.com',
          description: 'Find delicious recipes with the ingredients you already have.',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://ihavenomenu.com/?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        })
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'I Have No Menu',
          url: 'https://ihavenomenu.com',
          logo: 'https://ihavenomenu.com/logo.svg',
          sameAs: []
        })
      }
    ]
  })
})
