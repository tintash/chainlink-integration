;; Stxlink token transfer trait

(use-trait oracle-callback .oracle-callback-trait.oracle-callback)
(define-trait stxlink-transfer-trait
  (
    ;; Called when token transfer succeeds
    ;; Should call the oracle contract
    (transfer-success (uint (buff 66) (buff 84) (buff 1024) <oracle-callback>) (response bool uint))

    ;; Called when token transfer fails
    (transfer-failure (uint) (response uint uint))
  )
)