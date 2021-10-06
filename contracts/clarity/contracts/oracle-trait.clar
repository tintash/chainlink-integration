;; Oracle trait
(use-trait oracle-callback .oracle-callback-trait.oracle-callback)
(define-trait oracle-trait
  (
    ;; Makes a oracle request aimed for chainlink
    ;; Must emit print event 
    (oracle-request (principal (buff 66) (buff 84) <oracle-callback> uint uint uint (buff 1024)) (response bool uint))

    ;; Serves chainlink job result back
    (fullfill-oracle-request ((buff 32) <oracle-callback> uint uint (buff 84) (optional (buff 128))) (response bool uint))

    ;; Withdraws stxlink tokens from oracle contract
    ;; Should implement the transfer token functionality
    (withdraw-token (principal) (response uint uint))
  )
)

