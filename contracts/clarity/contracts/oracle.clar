;; Chainlink Oracle
;; Implementation of the Chainlink oracle protocol

;; Errors
(define-constant err-stx-transfer-failed (err u10))
(define-constant err-request-id-creation-failed (err u11))
(define-constant err-reconstructed-id-construction-failed (err u12))
(define-constant err-request-not-found (err u13))
(define-constant err-reconstructed-id-not-equal (err u14))
(define-constant err-request-expired (err u15))
(define-constant err-invalid-tx-sender (err u16))

;; Exipiration limit
(define-constant expiration-limit u1000)

;; Observer-server's wallet address
(define-constant initiator 'ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G)

;; Contract owners
(define-map contract-owners principal bool)
(define-private (is-valid-owner?) (is-some (map-get? contract-owners tx-sender)))

;; Traits
(define-trait oracle-callback
    ((oracle-callback-handler ((optional (buff 128))) (response uint uint))))

;; Map of all the requests
(define-map request-ids { request-id:  (buff 32) } { expiration: uint })

;; Total no of requests sent to oracle 
(define-data-var request-count uint u0)

;; getting updated request counts
(define-public (get-request-count)
    (ok (var-get request-count))
)

;; function to calculate request id using certain parameters
(define-public (create-request-id  (payment uint) (expiration uint) (sender-id-buff (buff 84)))
    (begin
        (ok (keccak256 (concat (concat (concat (keccak256 payment) (keccak256 expiration)) (keccak256 (var-get request-count))) (keccak256 sender-id-buff))))
    )
)

;; function to calculate request id using certain parameters
(define-public (reconstruct-request-id  (payment uint) (expiration uint) (req-count uint) (sender-id-buff (buff 84)))
    (begin
        (ok (keccak256 (concat (concat (concat (keccak256 payment) (keccak256 expiration)) (keccak256 req-count)) (keccak256 sender-id-buff))))
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
                                (sender-id-buff (buff 84))                                
                                (callback <oracle-callback>)
                                (nonce uint)
                                (data-version uint)
                                (data (buff 1024)))
    (begin
        (let ((result (unwrap! (stx-transfer? payment sender initiator) err-stx-transfer-failed)))
            (let ((expiration-block-height block-height))     ;; todo(ludo): set        
                (var-set request-count (+ u1 (var-get request-count)))
                (let ((hashed-val (unwrap! (create-request-id payment expiration-block-height sender-id-buff) err-request-id-creation-failed)))
                    (map-set request-ids { request-id: hashed-val } { expiration: expiration-block-height })
                    (print {
                        request_id: hashed-val,
                        expiration: expiration-block-height,
                        sender: sender,
                        payment: payment,
                        spec_id: spec-id,
                        callback: callback,
                        nonce: nonce,
                        data_version: data-version,
                        data: data,
                        request_count: (var-get request-count),
                        hashed_val: hashed-val,
                        sender_id_buff: sender-id-buff
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
                                        (req-count uint)
                                        (sender-id-buff (buff 84))
                                        (data (optional (buff 128))))
    (let ((reconstructed-request-id (unwrap! (reconstruct-request-id payment expiration req-count sender-id-buff) err-reconstructed-id-construction-failed)))          ;; todo(ludo): must be able to reconstruct request-id  
        (asserts! (is-eq reconstructed-request-id request-id) err-reconstructed-id-not-equal)                                                           ;; reconstructed-request-id and request-id not equal
        (asserts! (is-valid-owner?) err-invalid-tx-sender)                                                                                              ;; check tx-sender validity
        (asserts! (is-some (map-get? request-ids { request-id: reconstructed-request-id })) err-request-not-found)                                      ;; reconstructed-request-id not present in the map
        (map-delete request-ids { request-id: reconstructed-request-id })                                                                               ;; remove request-id from map
        (asserts! (< block-height (+ expiration expiration-limit)) err-request-expired)                                                                 ;; block-height exceeded the limit and request-id expired
        (match (contract-call? callback oracle-callback-handler data)
            sucess (ok true)
            err (ok false)
        )
    )
)

(map-set contract-owners initiator true)                    ;; set observer-server as owner 
(map-set contract-owners 'ST20ATRN26N9P05V2F1RHFRV24X8C8M3W54E427B2 true) ;; clarinet contract tester