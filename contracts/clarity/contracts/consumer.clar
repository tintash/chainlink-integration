;; consumer

(define-data-var eth_price (optional (buff 128)) none)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

(define-public (get-eth-price 
                              (job-spec-id  (buff 66)) 
                              (data (buff 256)) 
                              (callback <oracle-callback>)  )
    (contract-call?
      .oracle                 ;; oracle name
      oracle-request          ;; oracle method
      tx-sender               ;; this contract's address
      u300                    ;; payment in micro stx
      job-spec-id             ;; chainlink jobspec id ;; 0x3334346664393436386561363437623838633530336461633830383263306134
      callback                ;; callback principal (addr) 
      u0                      ;; nonce
      u0                      ;; data version
      data                    ;; data (random for now)
    )
)

(define-public (oracle-callback-handler (price  (optional (buff 128))))
  (begin
    (var-set eth_price price)
    (ok u200)
  )
)

(define-read-only (eth-price)
  (ok (var-get eth_price))
)