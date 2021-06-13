;; Consumer Contract
;; Implementation of the making a request to chainlink oracle for Ether price and fulfilment of the request.

(define-data-var eth_price uint u1)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

;; Sends a request to Oracle contract for the updated price of Ether.
;; Contract call Parameters
  ;; .oracle: Oracle contarct name
  ;; oracle-request: Calling the oracle-request method of the oracle
  ;; tx-sender: The sender of the request that is Consumer contract.  
  ;; u1: The amount of payment given (specified in microSTX)           --> placeholder
  ;; job-spec-id: The Job Specification ID                             --> placeholder
  ;; callback: The principal (addr) to invoke for the response                
  ;; u0: The nonce sent by the requester                               --> placeholder
  ;; u0: The specified data version                                    --> placeholder
  ;; (buff 32): The CBOR payload of the request                        --> placeholder
(define-public (get-eth-price 
                              (job-spec-id  (buff 32)) (callback <oracle-callback>)  )
    (contract-call?
      .oracle                                                                   
      oracle-request                                                            
      tx-sender                                                                 
      u1                                                                        
      job-spec-id                                                               
      callback                                                                  
      u0                                                                       
      u0                                                                        
      0xde5b9eb9e7c5592930eb2e30a01369c36586d872082ed8181ee83d2a0ec20f04         
    )
)

;; Implementation of oracle-callback trait method oracle-callback-handler
;; Recieves price of Ether and update the eth_price variable.
(define-public (oracle-callback-handler (price uint))
  (begin
    (var-set eth_price price)
    (ok (var-get eth_price))
  )
)

;; Returns the value stored in the eth_price variable.
(define-read-only (eth-price)
  (ok (var-get eth_price))
)