(use-trait oracle-callback .oracle-callback-trait.oracle-callback)
(define-trait stxlink-transfer-trait
  (
    (transfer-success (uint (buff 66) (buff 84) (buff 1024) <oracle-callback>) (response bool uint))
    (transfer-failure (uint) (response uint uint))
  )
)