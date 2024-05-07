CREATE FUNCTION `wwmgca_app`.`remove_accents`(input_text VARCHAR(255)) RETURNS VARCHAR(255) CHARSET utf8mb4
BEGIN
    DECLARE output_text VARCHAR(255);
    SET output_text = CONVERT(input_text USING utf8);
    SET output_text = REGEXP_REPLACE(output_text, '[^a-zA-Z ]', '');
    SET output_text = REPLACE(output_text, ' ', '');
    RETURN UPPER(output_text);
END;