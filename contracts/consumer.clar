;; consumer

(define-data-var eth_price uint u1)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

(define-public (get-eth-price 
                              (job-spec-id  (buff 32)) (callback <oracle-callback>)  )
    (contract-call?
      .oracle                                                                   ;; oracle name
      oracle-request                                                            ;; oracle method
      tx-sender                                                                 ;; this contract's address
      u1                                                                        ;; payment in micro stx
      job-spec-id                                                               ;; chainlink jobspec id
      callback                                                                  ;; callback principal (addr) 
      u0                                                                        ;; nonce
      u0                                                                        ;; data version
      0xde5b9eb9e7c5592930eb2e30a01369c36586d872082ed8181ee83d2a0ec20f04        ;; data (random for now)
    )
)

(define-public (oracle-callback-handler (price uint))
  (begin
    (var-set eth_price price)
    (ok (var-get eth_price))
  )
)

(define-read-only (eth-price)
  (ok (var-get eth_price))
)