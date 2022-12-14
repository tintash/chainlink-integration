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
(define-constant err-fetching-balance (err u17))
(define-constant err-not-enough-funds (err u18))
(define-constant err-unable-to-withdraw (err u19))

;; Exipiration limit
(define-constant expiration-limit u1000)

;; Contract owners
(define-map contract-owners principal bool)
(define-private (is-valid-owner?) (is-some (map-get? contract-owners tx-sender)))

;; Oracle callback trait
(use-trait oracle-callback .oracle-callback-trait.oracle-callback)

;; Map of all the requests
(define-map request-ids { request-id:  (buff 32) } { expiration: uint })

;; Total no of requests sent to oracle 
(define-data-var request-count uint u0)

;; getting updated request counts
(define-read-only (get-request-count)
    (var-get request-count))

;; function to calculate request id using certain parameters
(define-private (create-request-id (expiration uint) (sender-id-buff (buff 84)))
    (keccak256 (concat (concat (keccak256 expiration) (keccak256 (var-get request-count))) (keccak256 sender-id-buff))))

;; function to calculate request id using certain parameters
(define-private (reconstruct-request-id (expiration uint) (req-count uint) (sender-id-buff (buff 84)))
    (keccak256 (concat (concat (keccak256 expiration) (keccak256 req-count)) (keccak256 sender-id-buff))))

;; function to remove request-id from map if we want to cancel the request
(define-public (cancel-request (hashed-request-id (buff 32)) )
    (if (is-request-present hashed-request-id)
        (ok (map-delete request-ids { request-id: hashed-request-id })) ;; request-id was present and deleted from map
        (ok false) ;; request-id not present
    ))

;; function to check the presence of request-id.
(define-read-only (is-request-present (hashed-request-id (buff 32)) )
    (is-some (map-get? request-ids { request-id: hashed-request-id })))


;; Creates the Chainlink request
;; Stores the hash of the params as the on-chain commitment for the request.
;; OracleRequest event for the Chainlink node to detect.
;; sender The sender of the request
;; spec-id The Job Specification ID
;; callback The principal to invoke for the response
;; payment The payment in FTs sent by the requester
;; nonce The nonce sent by the requester
;; data-version The specified data version
;; data The CBOR payload of the request
(define-public (oracle-request (sender principal)
                                (spec-id (buff 66))
                                (sender-id-buff (buff 84))                                
                                (callback <oracle-callback>)
                                (payment uint)
                                (nonce uint)
                                (data-version uint)
                                (data (buff 1024)))

        (begin
            (var-set request-count (+ u1 (var-get request-count)))
            (let ((hashed-val (create-request-id block-height sender-id-buff)))
                (map-set request-ids { request-id: hashed-val } { expiration: block-height })
                (print {
                    request_id: hashed-val,
                    expiration: block-height,
                    sender: sender,
                    spec_id: spec-id,
                    callback: callback,
                    payment: payment,
                    nonce: nonce,
                    data_version: data-version,
                    data: data,
                    request_count: (var-get request-count),
                    sender_id_buff: sender-id-buff
                })
                (ok true))))

;; Called by the Chainlink node to fulfill requests
;; Given params must hash back to the commitment stored from `oracle-request`.
;; call the callback address' callback function without bubbling up error
;; in an assertion so that the node can get paid.
;; request-id The fulfillment request ID that must match the requester's
;; callback The principal to invoke for the response
;; expiration The expiration that the node should respond by before the requester can cancel
;; data The data to return to the consuming contract
;; Status if the external call was successful
(define-public (fullfill-oracle-request (request-id (buff 32))
                                        (callback <oracle-callback>)
                                        (expiration uint)
                                        (req-count uint)
                                        (sender-id-buff (buff 84))
                                        (data (optional (buff 128))))
    (let ((reconstructed-request-id (reconstruct-request-id expiration req-count sender-id-buff)))
        (asserts! (is-eq reconstructed-request-id request-id) err-reconstructed-id-not-equal)
        (asserts! (is-valid-owner?) err-invalid-tx-sender)
        (asserts! (is-some (map-get? request-ids { request-id: reconstructed-request-id })) err-request-not-found)
        (map-delete request-ids { request-id: reconstructed-request-id })
        (asserts! (< block-height (+ expiration expiration-limit)) err-request-expired)
        (match (contract-call? callback oracle-callback-handler data)
            sucess (ok true)
            err (ok false))))

;; function to check the if funds are greater than amount.
(define-private (has-enough-funds (amount uint))
    (let ((balance (unwrap-panic (as-contract (contract-call? .stxlink-token get-balance tx-sender))) ))
        (print { amount: amount, balance: balance, fn-name: "has-enough-funds" })
        (>= balance amount)
    ))

;; function to withdraw stxlink token from contract.
(define-public (withdraw-token (receiver principal) (amount uint))
    (begin
        (print { amount: amount, receiver: receiver, fn-name: "withdraw-token" })
        (asserts! (is-valid-owner?) err-invalid-tx-sender)
        (let ((can-withdraw (has-enough-funds amount) ))
            (print { can-withdraw: can-withdraw, amount: amount, receiver: receiver, fn-name: "withdraw-token" })
            (asserts! (is-eq can-withdraw true) err-not-enough-funds))
            (print { assert-passed: true, amount: amount, receiver: receiver, fn-name: "withdraw-token" })
            (as-contract (contract-call? 
                .stxlink-token
                transfer
                amount
                tx-sender
                receiver
                none))))  

(map-set contract-owners tx-sender true)
