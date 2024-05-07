SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM wwmgca_app.users_keys;
ALTER TABLE wwmgca_app.users_keys AUTO_INCREMENT=0;
DELETE FROM wwmgca_app.users;
ALTER TABLE wwmgca_app.users AUTO_INCREMENT=0;

INSERT INTO
    wwmgca_app.users (
        id,
        evento,
        created_at,
        updated_at,
        STATUS,
        NAME,
        cpf,
        email,
        telefone,
        PASSWORD,
        password_reset_token,
        sms_token,
        id_cadas,
        cliente,
        dominio,
        admin,
        gestor,
        multiCliente,
        consignatario,
        openFinance,
        tipoUsuario,
        averbaOnline,
        cad_servidores,
        financeiro,
        con_contratos,
        cad_orgao,
        f_ano,
        f_mes,
        f_complementar,
        tkn_api,
        time_to_pas_expires
    ) (
        SELECT
            id,
            evento,
            created_at,
            updated_at,
            STATUS,
            NAME,
            cpf,
            email,
            telefone,
            PASSWORD,
            password_reset_token,
            sms_token,
            id_cadas,
            cliente,
            dominio,
            admin,
            gestor,
            multiCliente,
            consignatario,
            openFinance,
            tipoUsuario,
            averbaOnline,
            cad_servidores,
            financeiro,
            con_contratos,
            cad_orgao,
            f_ano,
            f_mes,
            f_complementar,
            tkn_api,
            time_to_pas_expires
        FROM
            wwmgca_api.users
    );

INSERT INTO
    wwmgca_app.users_keys (
        id,
        STATUS,
        evento,
        created_at,
        id_users,
        PASSWORD
    ) (
        SELECT
            0,
            STATUS,
            1,
            NOW(),
            id,
            PASSWORD
        FROM
            wwmgca_app.users
    );

ALTER TABLE
    wwmgca_app.users DROP COLUMN PASSWORD;