;; Chainlink Oracle
;; Implementation of the Chainlink oracle protocol

(define-trait oracle-callback
    ((oracle-callback-handler (uint) (response uint uint))))

;; Map of all the requests
(define-map request-ids { request-id:  (buff 32) } { finished: bool })

;; Total no of requests sent to oracle
(define-data-var total-requests uint u0)

;; function to calculate request id using certain parameters
(define-public (create-request-id  (payment uint) (expiration uint))
    (begin
        (var-set total-requests (+ (var-get total-requests) u1));; increashing total requests
        (ok (keccak256 (concat (keccak256 payment) (keccak256 expiration))))
    )
)

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
                               (spec-id (buff 66))
                               (callback <oracle-callback>)
                               (nonce uint)
                               (data-version uint)
                               (data (buff 86)))
    (begin
        (let ((result (unwrap! (stx-transfer? payment sender 'ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK) (err u1))))
                (let ((request-id u1)         ;; todo(ludo): must be unique - EVM version is building request-id by hashing payment+callback+expiration
                        (expiration u999999))     ;; todo(ludo): set        
                    (let ((hashed-val (unwrap! (create-request-id payment expiration) (err u333))))
                        (map-set request-ids { request-id: hashed-val } { finished: false })
                        (print {
                            request-id: (map-get? request-ids { request-id: hashed-val} ),
                            expiration: expiration,
                            sender: sender,
                            payment: payment,
                            spec-id: spec-id,
                            callback: callback,
                            nonce: nonce,
                            data-version: data-version,
                            data: data,
                            total-requests: (var-get total-requests),
                            hashed-val: hashed-val
                        })
                        (ok true)
                    )
                )
            )
    )
)

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