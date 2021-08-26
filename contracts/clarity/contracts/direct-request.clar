;; consumer

(define-data-var data-value (optional (buff 128)) none)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

(define-public (request-api 
                          (job-spec-id (buff 66)) 
                          (sender-id-buff (buff 84)) 
                          (data (buff 1024)) 
                          (callback <oracle-callback>))                        
    (contract-call?
      .oracle                 ;; oracle name
      oracle-request          ;; oracle method
      tx-sender               ;; this contract's address
      u500                    ;; payment in micro stx
      job-spec-id             ;; chainlink-job id
      sender-id-buff          ;; transaction-sender-id encoded to buffer 
      callback                ;; callback principal (addr) 
      u0                      ;; nonce
      u0                      ;; data version
      data                    ;; data
    ))

(define-public (oracle-callback-handler (value  (optional (buff 128))))
  (begin
    (var-set data-value value)
    (ok u200)))

(define-read-only (read-data-value)
  (ok (var-get data-value)))


(define-public (create-request                    
                    (job-spec-id (buff 66)) 
                    (sender-id-buff (buff 84)) 
                    (data (buff 1024)) 
                    (callback <oracle-callback>))                  
  (contract-call? 
    .stxlink-token 
    transfer-and-call
    job-spec-id
    sender-id-buff
    data
    callback ))