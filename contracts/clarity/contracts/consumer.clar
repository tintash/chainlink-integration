;; consumer

(define-data-var eth_price uint u1)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

(define-public (get-eth-price 
                              (job-spec-id  (buff 66)) (callback <oracle-callback>)  )
    (contract-call?
      .oracle                                                                   ;; oracle name
      oracle-request                                                            ;; oracle method
      tx-sender                                                                 ;; this contract's address
      u300                                                                      ;; payment in micro stx
      job-spec-id                                                               ;; chainlink jobspec id ;; 0x3334346664393436386561363437623838633530336461633830383263306134
      callback                                                                  ;; callback principal (addr) 
      u0                                                                        ;; nonce
      u0                                                                        ;; data version
      0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d        ;; data (random for now)
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