;; Chainlink Oracle
;; Implementation of the Chainlink oracle protocol

;; Errors
(define-constant err-stx-transfer-failed (err u10))
(define-constant err-request-id-creation-failed (err u11))
(define-constant err-reconstructed-id-construction-failed (err u12))
(define-constant err-request-not-found (err u13))
(define-constant err-reconstructed-id-not-equal (err u14))
(define-constant err-request-expired (err u15))

;; Exipiration limit
(define-constant expiration-limit u1000)

;; Observer-server's wallet address
(define-constant initiator 'ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G)

;; Traits
(define-trait oracle-callback
    ((oracle-callback-handler ((optional (buff 128))) (response uint uint))))

;; Map of all the requests
(define-map request-ids { request-id:  (buff 32) } { expiration: uint })

;; Total no of requests sent to oracle (variable for future usage)
(define-data-var total-requests uint u0)

;; function to calculate request id using certain parameters
(define-public (create-request-id  (payment uint) (expiration uint))
    (begin
        (ok (keccak256 (concat (keccak256 payment) (keccak256 expiration))))
    )
)

;; function to remove request-id from map if we want to cancel the request
(define-public (cancel-request (hashed-request-id (buff 32)) )
    (begin
        (if (unwrap! (is-request-present hashed-request-id) err-request-not-found)
            (ok (map-delete request-ids { request-id: hashed-request-id })) ;; request-id was present and deleted from map
            (ok false) ;; request-id not present
        )
    )
)

;; function to check the presence of request-id.
(define-public (is-request-present (hashed-request-id (buff 32)) )
    (if (is-none (map-get? request-ids { request-id: hashed-request-id }))
        (ok false)
        (ok true)
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
                                (data (buff 1024)))
    (begin
        (let ((result (unwrap! (stx-transfer? payment sender initiator) err-stx-transfer-failed)))
            (let ((expiration-block-height block-height))     ;; todo(ludo): set        
                (let ((hashed-val (unwrap! (create-request-id payment expiration-block-height) err-request-id-creation-failed)))
                    (map-set request-ids { request-id: hashed-val } { expiration: expiration-block-height })
                    (print {
                        request-id: hashed-val,
                        expiration: expiration-block-height,
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
(define-public (fullfill-oracle-request (request-id (buff 32))
                                        (payment uint)
                                        (callback <oracle-callback>)
                                        (expiration uint)
                                        (data (optional (buff 128))))
    (let ((reconstructed-request-id (unwrap! (create-request-id payment expiration) err-reconstructed-id-construction-failed)))       ;; todo(ludo): must be able to reconstruct request-id  
        (if (is-eq reconstructed-request-id request-id)
            (if (is-none (map-get? request-ids { request-id: reconstructed-request-id })) ;; This statement computes to true if reconstructed-request-id is not present in the map             
                err-request-not-found   ;; reconstructed-request-id not present in the map 
                (if (< block-height (+ expiration expiration-limit)) ;; check if the request id is expired or not
                    (begin   
                        (map-delete request-ids { request-id: reconstructed-request-id })                                      
                        (match (contract-call? callback oracle-callback-handler data)
                            sucess (ok true)
                            err (ok false))
                    )
                    (begin  ;; block-height exceeded the limit and request-id expired
                        (map-delete request-ids { request-id: reconstructed-request-id }) 
                        err-request-expired 
                    )
                )  
            )
            err-reconstructed-id-not-equal ;; reconstructed-request-id and request-id not equal
        )       
    )
)