# Cấu trúc thư mục

├── .dockerignore
├── .react-router
│   └── types
│       ├── +register.ts
│       ├── +virtual.d.ts
│       └── app
│           ├── +types
│           │   └── root.ts
│           └── routes
│               ├── +types
│               │   ├── 404.ts
│               │   ├── about.ts
│               │   ├── cart.ts
│               │   ├── category.ts
│               │   ├── checkout.ts
│               │   ├── contact.ts
│               │   ├── home.ts
│               │   ├── layout.ts
│               │   ├── order-success.ts
│               │   ├── order.ts
│               │   ├── orders.ts
│               │   ├── product.ts
│               │   ├── profile.ts
│               │   ├── search.ts
│               │   ├── well-known.ts
│               │   └── wishlist.ts
│               └── auth
│                   └── +types
│                       ├── layout.ts
│                       ├── login.ts
│                       └── register.ts
├── README.md
├── app
│   ├── api
│   │   ├── axios.ts
│   │   ├── index.ts
│   │   ├── services
│   │   │   ├── authService.ts
│   │   │   ├── brandService.ts
│   │   │   ├── cartService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── chatService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── productService.ts
│   │   │   ├── reviewService.ts
│   │   │   └── wishlistService.ts
│   │   └── types
│   │       ├── auth.ts
│   │       ├── brand.ts
│   │       ├── cache.ts
│   │       ├── cart.ts
│   │       ├── category.ts
│   │       ├── chat.ts
│   │       ├── common.ts
│   │       ├── index.ts
│   │       ├── order.ts
│   │       ├── product.ts
│   │       ├── review.ts
│   │       ├── search.ts
│   │       ├── seller.ts
│   │       └── wishlist.ts
│   ├── app.css
│   ├── components
│   │   ├── features
│   │   │   ├── banner
│   │   │   │   ├── Banner.tsx
│   │   │   │   ├── Banner.types.ts
│   │   │   │   ├── Banner.variants.ts
│   │   │   │   └── index.ts
│   │   │   ├── cart
│   │   │   │   ├── Cart.tsx
│   │   │   │   ├── Cart.types.ts
│   │   │   │   ├── Cart.variants.ts
│   │   │   │   ├── components
│   │   │   │   │   ├── CartEmpty.tsx
│   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   └── CartSummary.tsx
│   │   │   │   └── index.ts
│   │   │   ├── checkout
│   │   │   │   ├── OrderSummary.tsx
│   │   │   │   ├── PaymentMethodForm.tsx
│   │   │   │   ├── ShippingForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── product
│   │   │   │   ├── breadcrumb
│   │   │   │   ├── card
│   │   │   │   │   ├── ProductCard.tsx
│   │   │   │   │   ├── ProductCard.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── detail
│   │   │   │   │   ├── ProductImageGallery.tsx
│   │   │   │   │   ├── ProductInfo.tsx
│   │   │   │   │   ├── ProductPurchasePanel.tsx
│   │   │   │   │   └── ProductSpecifications.tsx
│   │   │   │   ├── grid
│   │   │   │   │   ├── ProductGrid.tsx
│   │   │   │   │   ├── ProductGrid.types.ts
│   │   │   │   │   ├── ProductGrid.variants.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── list
│   │   │   │       ├── ProductListView.tsx
│   │   │   │       └── ProductListView.types.ts
│   │   │   ├── profile
│   │   │   │   ├── ChangePasswordForm.tsx
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   └── ProfileHeader.tsx
│   │   │   ├── review
│   │   │   │   ├── ProductReviews.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   ├── ReviewItem.tsx
│   │   │   │   ├── ReviewList.tsx
│   │   │   │   ├── ReviewStats.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── search
│   │   │   │   ├── index.ts
│   │   │   │   ├── results
│   │   │   │   │   ├── SearchResults.tsx
│   │   │   │   │   ├── SearchResults.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── sort
│   │   │   │       ├── SearchSortOptions.tsx
│   │   │   │       ├── SearchSortOptions.types.ts
│   │   │   │       └── index.ts
│   │   │   ├── subcategory
│   │   │   │   ├── SubcategorySidebar.tsx
│   │   │   │   ├── SubcategorySidebar.types.ts
│   │   │   │   └── index.ts
│   │   │   └── topdeals
│   │   │       ├── TopDeals.tsx
│   │   │       ├── TopDeals.types.ts
│   │   │       ├── TopDeals.variants.ts
│   │   │       ├── components
│   │   │       │   └── DealItem.tsx
│   │   │       └── index.ts
│   │   ├── index.ts
│   │   ├── layout
│   │   │   ├── chatbot
│   │   │   │   ├── Chatbot.types.ts
│   │   │   │   ├── Chatbot.variants.ts
│   │   │   │   ├── ChatbotContent.tsx
│   │   │   │   ├── ChatbotIcon.tsx
│   │   │   │   ├── components
│   │   │   │   │   ├── ChatHeader.tsx
│   │   │   │   │   ├── ChatInput.tsx
│   │   │   │   │   ├── ChatMessage.tsx
│   │   │   │   │   ├── SuggestedUrlBanner.tsx
│   │   │   │   │   └── TypingIndicator.tsx
│   │   │   │   └── index.ts
│   │   │   ├── header
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Header.types.ts
│   │   │   │   ├── components
│   │   │   │   │   ├── Logo.tsx
│   │   │   │   │   ├── Navigation.tsx
│   │   │   │   │   ├── QuickCheckout.tsx
│   │   │   │   │   ├── SearchBar.tsx
│   │   │   │   │   └── UserMenu.tsx
│   │   │   │   └── index.ts
│   │   │   └── sidebar
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Sidebar.types.ts
│   │   │       ├── Sidebar.variants.ts
│   │   │       ├── components
│   │   │       │   ├── CategoryList.tsx
│   │   │       │   ├── FilterSection.tsx
│   │   │       │   ├── SearchFilter.tsx
│   │   │       │   └── SidebarHeader.tsx
│   │   │       └── index.ts
│   │   ├── shared
│   │   │   └── ClientOnly.tsx
│   │   └── ui
│   │       ├── button
│   │       │   ├── Button.tsx
│   │       │   ├── Button.types.ts
│   │       │   ├── Button.variants.ts
│   │       │   └── index.ts
│   │       ├── scroll
│   │       │   ├── InfiniteScroll.tsx
│   │       │   ├── InfiniteScroll.types.ts
│   │       │   └── index.ts
│   │       ├── search
│   │       │   ├── SearchInput.tsx
│   │       │   ├── SearchInput.types.ts
│   │       │   └── index.ts
│   │       └── view-toggle
│   │           ├── ViewToggle.tsx
│   │           ├── ViewToggle.types.ts
│   │           └── index.ts
│   ├── contexts
│   │   ├── AppProvider.tsx
│   │   ├── CartContext.tsx
│   │   ├── ChatbotContext.tsx
│   │   ├── WishlistContext.tsx
│   │   └── index.ts
│   ├── hooks
│   │   ├── auth
│   │   │   ├── index.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useAuth.types.ts
│   │   ├── cart
│   │   │   ├── index.ts
│   │   │   ├── useCart.ts
│   │   │   └── useCart.types.ts
│   │   ├── category
│   │   │   ├── index.ts
│   │   │   ├── useCategories.ts
│   │   │   └── useCategories.types.ts
│   │   ├── chatbot
│   │   │   ├── index.ts
│   │   │   ├── useChatbot.ts
│   │   │   └── useChatbot.types.ts
│   │   ├── orders
│   │   │   ├── index.ts
│   │   │   ├── useOrders.ts
│   │   │   └── useOrders.types.ts
│   │   ├── product
│   │   │   ├── index.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useProducts.types.ts
│   │   ├── review
│   │   │   ├── index.ts
│   │   │   ├── useReviews.ts
│   │   │   └── useReviews.types.ts
│   │   ├── search
│   │   │   ├── index.ts
│   │   │   ├── useProductSearch.ts
│   │   │   └── useProductSearch.types.ts
│   │   ├── special
│   │   │   ├── index.ts
│   │   │   ├── useSpecialProducts.ts
│   │   │   └── useSpecialProducts.types.ts
│   │   ├── subcategory
│   │   │   └── useSubcategories.ts
│   │   ├── user
│   │   │   ├── index.ts
│   │   │   ├── useUser.ts
│   │   │   └── useUser.types.ts
│   │   ├── utils
│   │   │   ├── reduxHooks.ts
│   │   │   ├── useClientOnly.ts
│   │   │   ├── useHydrated.ts
│   │   │   └── useIsomorphicLayoutEffect.ts
│   │   ├── window
│   │   │   ├── useWindowSize.ts
│   │   │   └── useWindowSize.types.ts
│   │   └── wishlist
│   │       ├── index.ts
│   │       ├── useWishlist.ts
│   │       └── useWishlist.types.ts
│   ├── lib
│   │   └── utils.ts
│   ├── root.tsx
│   ├── routes
│   │   ├── 404.tsx
│   │   ├── about.tsx
│   │   ├── auth
│   │   │   ├── layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── cart.tsx
│   │   ├── category.tsx
│   │   ├── checkout.tsx
│   │   ├── contact.tsx
│   │   ├── home.tsx
│   │   ├── layout.tsx
│   │   ├── order-success.tsx
│   │   ├── order.tsx
│   │   ├── orders.tsx
│   │   ├── product.tsx
│   │   ├── profile.tsx
│   │   ├── search.tsx
│   │   ├── well-known.tsx
│   │   └── wishlist.tsx
│   ├── routes.ts
│   ├── store
│   │   ├── index.ts
│   │   ├── middleware.ts
│   │   ├── rootReducer.ts
│   │   ├── selectors
│   │   │   ├── authSelectors.ts
│   │   │   └── index.ts
│   │   ├── slices
│   │   │   ├── authSlice.ts
│   │   │   └── index.ts
│   │   ├── types
│   │   │   ├── index.ts
│   │   │   ├── states.ts
│   │   │   └── store.ts
│   │   └── utils
│   │       ├── index.ts
│   │       └── secureStorage.ts
│   └── tailwind.config.ts
├── build
│   ├── client
│   │   ├── assets
│   │   │   ├── 404-BLbiRfmS.js
│   │   │   ├── Banner-fi4yaZ1W.js
│   │   │   ├── Chatbot-Bv4FE2Sf.js
│   │   │   ├── ClientOnly-CvJZ-mRV.js
│   │   │   ├── TopDeals-BFVz_9tX.js
│   │   │   ├── about-jDs3F43M.js
│   │   │   ├── cart-DH9H3pZe.js
│   │   │   ├── category-35IkKN8e.js
│   │   │   ├── chevron-right-BZ4yd5Yb.js
│   │   │   ├── chunk-D4RADZKF-afMzVe-l.js
│   │   │   ├── contact-DOlwb-Ua.js
│   │   │   ├── createLucideIcon-DLZsNlNf.js
│   │   │   ├── entry.client-GlOYeMiF.js
│   │   │   ├── eye-B0KOw507.js
│   │   │   ├── heart-tOiw7zbK.js
│   │   │   ├── home-CQGkGsRC.js
│   │   │   ├── index-BFYyrW5_.js
│   │   │   ├── index-Cu4r-sPX.js
│   │   │   ├── jsx-runtime-BjG_zV1W.js
│   │   │   ├── layout-BK0K9CBL.js
│   │   │   ├── layout-C5LY-oXJ.js
│   │   │   ├── layout-CgvxuJ5a.js
│   │   │   ├── login-B8mjaG6G.js
│   │   │   ├── manifest-cda7d8c1.js
│   │   │   ├── product-BZzvZe-8.js
│   │   │   ├── react-redux-DReir8LX.js
│   │   │   ├── reduxHooks-hg7xnNgN.js
│   │   │   ├── register-x71UE6Qu.js
│   │   │   ├── root-DQnfIOce.css
│   │   │   ├── root-EC6wIp_g.js
│   │   │   ├── server-build-DQnfIOce.css
│   │   │   ├── shopping-bag-C3gsPnhl.js
│   │   │   ├── star-BTevNefc.js
│   │   │   ├── truck-C5nhqTu2.js
│   │   │   ├── useCart-DfbhOvEz.js
│   │   │   ├── useHydrated-C3cdI0X1.js
│   │   │   ├── well-known-tvl5B_Lz.js
│   │   │   └── with-props-DlEqsjQX.js
│   │   ├── banners
│   │   │   ├── banner_1.webp
│   │   │   ├── banner_2.webp
│   │   │   ├── banner_3.webp
│   │   │   ├── banner_4.webp
│   │   │   ├── banner_5.webp
│   │   │   └── banner_6.webp
│   │   ├── favicon.ico
│   │   ├── features
│   │   │   ├── BeautyHealth.png
│   │   │   ├── Bestsellings.png
│   │   │   ├── Coupon.png
│   │   │   ├── Sale.png
│   │   │   ├── SalesAgents.png
│   │   │   ├── TopDeal.png
│   │   │   ├── Traveling.png
│   │   │   ├── ValentineGifts.png
│   │   │   └── VitaminForBaby.png
│   │   ├── icons
│   │   └── images
│   │       ├── loginBackground.svg
│   │       └── registerBackground.svg
│   └── server
│       ├── assets
│       │   ├── Banner-DPwmvJnS.js
│       │   ├── Chatbot-DKbPg2UA.js
│       │   ├── TopDeals-Cq3A17Vw.js
│       │   └── server-build-F5OysmWT.js
│       └── index.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── public
│   ├── banners
│   │   ├── banner_1.webp
│   │   ├── banner_2.webp
│   │   ├── banner_3.webp
│   │   ├── banner_4.webp
│   │   ├── banner_5.webp
│   │   └── banner_6.webp
│   ├── favicon.ico
│   ├── features
│   │   ├── BeautyHealth.png
│   │   ├── Bestsellings.png
│   │   ├── Coupon.png
│   │   ├── Sale.png
│   │   ├── SalesAgents.png
│   │   ├── TopDeal.png
│   │   ├── Traveling.png
│   │   ├── ValentineGifts.png
│   │   └── VitaminForBaby.png
│   ├── icons
│   └── images
│       ├── loginBackground.svg
│       └── registerBackground.svg
├── react-router.config.ts
├── tsconfig.json
└── vite.config.ts