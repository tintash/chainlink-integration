
(use-trait oracle-callback .oracle-callback-trait.oracle-callback)
(define-trait oracle-trait
  (
    (oracle-request (principal (buff 66) (buff 84) <oracle-callback> uint uint uint (buff 1024)) (response bool uint))

    (fullfill-oracle-request ((buff 32) <oracle-callback> uint uint (buff 84) (optional (buff 128))) (response bool uint))
  )
)

