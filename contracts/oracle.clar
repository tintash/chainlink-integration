;; Chainlink Oracle
;; Implementation of the Chainlink oracle protocol

(define-trait oracle-callback
    ((oracle-callback-handler (uint) (response uint uint))))

;; Creates the Chainlink request
;; Stores the hash of the params as the on-chain commitment for the request.
;; OracleRequest event for the Chainlink node to detect.
;; sender The sender of the request
;; payment The amount of payment given (specified in microSTX)
;; spec-id The Job Specification ID
;; callback The principal to invoke for the response
;; nonce The nonce sent by the requester
;; data-version The specified data version
;; data The CBOR payload of the request
(define-public (oracle-request (sender principal)
                               (payment uint)
                               (spec-id (buff 32))
                               (callback <oracle-callback>)
                               (nonce uint)
                               (data-version uint)
                               (data (buff 32)))
    (let ((request-id u1)           ;; todo(ludo): must be unique - EVM version is building request-id by hashing payment+callback+expiration
          (expiration u999999))     ;; todo(ludo): set
        (print {
            request-id: request-id,
            expiration: expiration,
            sender: sender,
            payment: payment,
            spec-id: spec-id,
            callback: callback,
            nonce: nonce,
            data-version: data-version,
            data: data 
        })
        (ok true)))

;; Called by the Chainlink node to fulfill requests
;; Given params must hash back to the commitment stored from `oracle-request`.
;; call the callback address' callback function without bubbling up error
;; in an assertion so that the node can get paid.
;; request-id The fulfillment request ID that must match the requester's
;; payment The payment amount that will be released for the oracle (specified in microSTX)
;; callback The principal to invoke for the response
;; expiration The expiration that the node should respond by before the requester can cancel
;; data The data to return to the consuming contract
;; Status if the external call was successful
(define-public (fullfill-oracle-request (request-id uint)
                                        (payment uint)
                                        (callback <oracle-callback>)
                                        (expiration uint)
                                        (data uint))
    (let ((reconstructed-request-id u1))       ;; todo(ludo): must be able to reconstruct request-id
        (match (contract-call? callback oracle-callback-handler data)
            sucess (ok true)
            err (ok false))))