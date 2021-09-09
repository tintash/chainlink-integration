(use-trait oracle-callback .oracle.oracle-callback)
(define-trait stxlink-transfer-trait
  (
    ;; Transfer from the caller to a new principal
    (transfer-success (uint (buff 66) (buff 84) (buff 1024) <oracle-callback>) (response bool uint))
    (transfer-failure (uint) (response uint uint))

  )
)