CREATE TABLE brand (
    autoid  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE perfume (
    autoid            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey            UUID           NOT NULL DEFAULT gen_random_uuid(),
    code              VARCHAR(50)    NOT NULL,
    brand_syskey      UUID           NOT NULL,
    name              VARCHAR(150)   NOT NULL,
    type              VARCHAR(10)    NOT NULL DEFAULT 'EDP',
    size_ml           INT            NOT NULL,
    qty               INT            NOT NULL DEFAULT 0,
    gender            VARCHAR(10)    NOT NULL DEFAULT 'Unisex',
    original_price    NUMERIC(12,2)  NOT NULL DEFAULT 0,
    sell_price        NUMERIC(12,2)  NOT NULL DEFAULT 0,
    discount_percent  NUMERIC(5,2)   NOT NULL DEFAULT 0,
    status            VARCHAR(10)    NOT NULL DEFAULT 'Active',
    createdby         VARCHAR(50),
    createddate       TIMESTAMP      NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC') + interval '6 hours 30 minutes'),
    modifiedby        VARCHAR(50),
    modifieddate      TIMESTAMP,

    CONSTRAINT uq_perfume_syskey UNIQUE (syskey),
    CONSTRAINT uq_perfume_code   UNIQUE (code),
    CONSTRAINT fk_perfume_brand  FOREIGN KEY (brand_syskey) REFERENCES brand (syskey),
    CONSTRAINT ck_perfume_type     CHECK (type IN ('EDP','EDT','Parfum','Cologne')),
    CONSTRAINT ck_perfume_gender   CHECK (gender IN ('Male','Female','Unisex')),
    CONSTRAINT ck_perfume_status   CHECK (status IN ('Active','Inactive')),
    CONSTRAINT ck_perfume_qty      CHECK (qty >= 0),
    CONSTRAINT ck_perfume_size     CHECK (size_ml > 0),
    CONSTRAINT ck_perfume_discount CHECK (discount_percent BETWEEN 0 AND 100)
);

ALTER TABLE perfume ALTER COLUMN status TYPE INTEGER USING status::integer;


CREATE TABLE customer (
    autoid        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey        UUID          NOT NULL DEFAULT gen_random_uuid(),
    name          VARCHAR(150)  NOT NULL,
    mobile        VARCHAR(20)   NOT NULL,
    address       VARCHAR(300),
    createdby     VARCHAR(50),
    createddate   TIMESTAMP     NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Yangon'),
    modifiedby    VARCHAR(50),
    modifieddate  TIMESTAMP,

    CONSTRAINT uq_customer_syskey UNIQUE (syskey),
    CONSTRAINT uq_customer_mobile UNIQUE (mobile)
);

CREATE TABLE invoice (
    autoid           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey           UUID           NOT NULL DEFAULT gen_random_uuid(),
    invoice_no       VARCHAR(30)    NOT NULL,
    customer_syskey  UUID           NOT NULL,
    invoice_date     TIMESTAMP      NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Yangon'),
    subtotal         NUMERIC(12,2)  NOT NULL DEFAULT 0,
    discount_total   NUMERIC(12,2)  NOT NULL DEFAULT 0,
    grand_total      NUMERIC(12,2)  NOT NULL DEFAULT 0,
    payment_method   VARCHAR(20)    NOT NULL DEFAULT 'Cash',
    status           VARCHAR(10)    NOT NULL DEFAULT 'Paid',
    createdby        VARCHAR(50),
    createddate      TIMESTAMP      NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Yangon'),
    modifiedby       VARCHAR(50),
    modifieddate     TIMESTAMP,

    CONSTRAINT uq_invoice_syskey     UNIQUE (syskey),
    CONSTRAINT uq_invoice_no         UNIQUE (invoice_no),
    CONSTRAINT fk_invoice_customer   FOREIGN KEY (customer_syskey) REFERENCES customer (syskey),
    CONSTRAINT ck_invoice_subtotal   CHECK (subtotal >= 0),
    CONSTRAINT ck_invoice_discount   CHECK (discount_total >= 0 AND discount_total <= subtotal),
    CONSTRAINT ck_invoice_grand      CHECK (grand_total = subtotal - discount_total),
    CONSTRAINT ck_invoice_payment    CHECK (payment_method IN ('Cash','Card','Mobile Payment','Bank Transfer')),
    CONSTRAINT ck_invoice_status     CHECK (status IN ('Paid','Unpaid','Cancelled'))
);

CREATE INDEX idx_invoice_customer ON invoice (customer_syskey);
CREATE INDEX idx_invoice_date     ON invoice (invoice_date);


CREATE TABLE invoice_item (
    autoid            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey            UUID           NOT NULL DEFAULT gen_random_uuid(),
    invoice_syskey    UUID           NOT NULL,
    perfume_syskey    UUID           NOT NULL,
    qty               INT            NOT NULL,
    unit_price        NUMERIC(12,2)  NOT NULL,
    discount_percent  NUMERIC(5,2)   NOT NULL DEFAULT 0,
    line_total        NUMERIC(12,2)  NOT NULL,

    CONSTRAINT uq_invoice_item_syskey   UNIQUE (syskey),
    CONSTRAINT fk_item_invoice          FOREIGN KEY (invoice_syskey) REFERENCES invoice (syskey),
    CONSTRAINT fk_item_perfume          FOREIGN KEY (perfume_syskey) REFERENCES perfume (syskey),
    CONSTRAINT ck_item_qty              CHECK (qty > 0),
    CONSTRAINT ck_item_unit_price       CHECK (unit_price >= 0),
    CONSTRAINT ck_item_discount         CHECK (discount_percent BETWEEN 0 AND 100)
);

CREATE INDEX idx_item_invoice ON invoice_item (invoice_syskey);
CREATE INDEX idx_item_perfume ON invoice_item (perfume_syskey);


CREATE TABLE stock_movement (
    autoid          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    syskey          UUID         NOT NULL DEFAULT gen_random_uuid(),
    perfume_syskey  UUID         NOT NULL,
    change_qty      INT          NOT NULL,
    reason          VARCHAR(20)  NOT NULL,
    ref_type        VARCHAR(20),
    ref_syskey      UUID,
    createdby       VARCHAR(50),
    createddate     TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Yangon'),

    CONSTRAINT uq_stock_movement_syskey UNIQUE (syskey)
);