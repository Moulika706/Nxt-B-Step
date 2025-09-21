import sqlite3

def crds():
    file = 'accurates.db'
    script = """
    INSERT INTO subject VALUES (9200000, 'Jane Smith 1', NULL, '7211755002', '617 Main St', NULL, 'Dallas');
    INSERT INTO subject VALUES (9200001, 'Bob Brown 2', 'Alias1', '9883481367', '700 Main St', NULL, 'San Jose');
    INSERT INTO subject VALUES (9200002, 'Frank Green 3', NULL, '2252583295', '94 Main St', NULL, 'Los Angeles');
    INSERT INTO subject VALUES (9200003, 'Grace Harris 4', NULL, '5413982250', '750 Main St', NULL, 'Dallas');
    INSERT INTO subject VALUES (9200004, 'David Evans 5', NULL, '5245785244', '97 Main St', 'Apt 13', 'Philadelphia');
    INSERT INTO subject VALUES (9200005, 'Eve Foster 6', NULL, '1039726776', '499 Main St', NULL, 'Phoenix');
    INSERT INTO subject VALUES (9200006, 'Frank Green 7', 'Alias6', '9906505513', '71 Main St', 'Apt 32', 'Phoenix');
    INSERT INTO subject VALUES (9200007, 'Alice Johnson 8', NULL, '8511387882', '256 Main St', NULL, 'Philadelphia');
    INSERT INTO subject VALUES (9200008, 'Charlie Davis 9', NULL, '5905374918', '195 Main St', NULL, 'San Antonio');
    INSERT INTO subject VALUES (9200009, 'John Doe 10', 'Alias9', '2456442497', '174 Main St', NULL, 'Phoenix');
    INSERT INTO order_request VALUES (5320000, 'Y9200000', 9200000, 'CARD', 'F', 13179);
    INSERT INTO order_request VALUES (5320001, 'Y9200001', 9200001, 'GEO', 'F', 41);
    INSERT INTO order_request VALUES (5320002, 'Y9200002', 9200002, 'GEO', 'F', 41);
    INSERT INTO order_request VALUES (5320003, 'Y9200003', 9200003, 'GEO', 'F', 41);
    INSERT INTO order_request VALUES (5320004, 'Y9200004', 9200004, 'CARD', 'N', 13179);
    INSERT INTO order_request VALUES (5320005, 'Y9200005', 9200005, 'TAKE', 'F', 4965);
    INSERT INTO order_request VALUES (5320006, 'Y9200006', 9200006, 'GEO', 'N', 41);
    INSERT INTO order_request VALUES (5320007, 'Y9200007', 9200007, 'NRPC', 'N', 6343);
    INSERT INTO order_request VALUES (5320008, 'Y9200008', 9200008, 'AMZSF', 'F', 2227);
    INSERT INTO order_request VALUES (5320009, 'Y9200009', 9200009, 'NRPC', 'N', 6343);
    INSERT INTO search VALUES (56000000, 'Y9200000', 9200000, 'TERB', 'N', 'NONE', 'CA', 13179, 'Unable to Verify');
    INSERT INTO search VALUES (56000001, 'Y9200000', 9200000, 'FED-CR', 'N', 'Los Angeles', 'CA', 13179, 'Developed Information');
    INSERT INTO search VALUES (56000002, 'Y9200000', 9200000, 'OFAC', 'F', 'Harris', 'NA', 13179, 'Developed Information');
    INSERT INTO search VALUES (56000003, 'Y9200000', 9200000, 'FED-CR', 'N', 'NONE', 'TX', 13179, NULL);
    INSERT INTO search VALUES (56000004, 'Y9200000', 9200000, 'OFAC', 'N', 'NONE', 'NY', 13179, 'Developed Information');
    INSERT INTO search VALUES (56000005, 'Y9200000', 9200000, 'MOV', 'N', 'Los Angeles', 'NA', 13179, NULL);
    INSERT INTO search VALUES (56000010, 'Y9200001', 9200001, 'EDU', 'N', 'Cook', 'NY', 41, 'Discrepancy Found');
    INSERT INTO search VALUES (56000011, 'Y9200001', 9200001, 'MOV', 'N', 'NONE', 'CA', 41, NULL);
    INSERT INTO search VALUES (56000012, 'Y9200001', 9200001, 'FED-CR', 'N', 'Cook', 'NA', 41, 'Discrepancy Found');
    INSERT INTO search VALUES (56000013, 'Y9200001', 9200001, 'TERB', 'N', 'Los Angeles', 'TX', 41, 'Unable to Verify');
    INSERT INTO search VALUES (56000020, 'Y9200002', 9200002, 'TERB', 'F', 'Harris', 'TX', 41, NULL);
    INSERT INTO search VALUES (56000021, 'Y9200002', 9200002, 'EDU', 'N', 'NONE', 'NA', 41, NULL);
    INSERT INTO search VALUES (56000022, 'Y9200002', 9200002, 'F/M', 'N', 'NONE', 'IL', 41, 'Unable to Verify');
    INSERT INTO search VALUES (56000023, 'Y9200002', 9200002, 'ADJ', 'N', 'NONE', 'IL', 41, NULL);
    INSERT INTO search VALUES (56000024, 'Y9200002', 9200002, 'ADJ', 'F', 'Cook', 'NY', 41, NULL);
    INSERT INTO search VALUES (56000025, 'Y9200002', 9200002, 'NCRIM', 'F', 'Cook', 'CA', 41, NULL);
    INSERT INTO search VALUES (56000030, 'Y9200003', 9200003, 'MVR', 'F', 'Cook', 'NY', 41, NULL);
    INSERT INTO search VALUES (56000031, 'Y9200003', 9200003, 'EMP', 'F', 'Los Angeles', 'IL', 41, 'Unable to Verify');
    INSERT INTO search VALUES (56000032, 'Y9200003', 9200003, 'MOV', 'N', 'Harris', 'NY', 41, 'Unable to Verify');
    INSERT INTO search VALUES (56000033, 'Y9200003', 9200003, 'OFAC', 'F', 'Los Angeles', 'NA', 41, 'Developed Information');
    INSERT INTO search VALUES (56000034, 'Y9200003', 9200003, 'SON', 'F', 'Los Angeles', 'NA', 41, NULL);
    INSERT INTO search VALUES (56000035, 'Y9200003', 9200003, 'MOV', 'F', 'Los Angeles', 'NA', 41, NULL);
    INSERT INTO search VALUES (56000040, 'Y9200004', 9200004, 'SON', 'F', 'NONE', 'TX', 13179, 'Developed Information');
    INSERT INTO search VALUES (56000041, 'Y9200004', 9200004, 'OFAC', 'F', 'Los Angeles', 'CA', 13179, NULL);
    INSERT INTO search VALUES (56000042, 'Y9200004', 9200004, 'EDU', 'F', 'Harris', 'CA', 13179, 'Developed Information');
    INSERT INTO search VALUES (56000043, 'Y9200004', 9200004, 'EDU', 'F', 'NONE', 'TX', 13179, NULL);
    INSERT INTO search VALUES (56000044, 'Y9200004', 9200004, 'OFAC', 'F', 'NONE', 'NA', 13179, 'Discrepancy Found');
    INSERT INTO search VALUES (56000045, 'Y9200004', 9200004, 'ADJ', 'N', 'Harris', 'TX', 13179, 'Discrepancy Found');
    INSERT INTO search VALUES (56000050, 'Y9200005', 9200005, 'MVR', 'F', 'Cook', 'NA', 4965, NULL);
    INSERT INTO search VALUES (56000051, 'Y9200005', 9200005, 'TERB', 'N', 'Los Angeles', 'NA', 4965, NULL);
    INSERT INTO search VALUES (56000052, 'Y9200005', 9200005, 'OFAC', 'F', 'NONE', 'NY', 4965, NULL);
    INSERT INTO search VALUES (56000053, 'Y9200005', 9200005, 'MOV', 'F', 'Harris', 'NA', 4965, NULL);
    INSERT INTO search VALUES (56000054, 'Y9200005', 9200005, 'NCRIM', 'F', 'NONE', 'TX', 4965, NULL);
    INSERT INTO search VALUES (56000055, 'Y9200005', 9200005, 'TERB', 'N', 'Cook', 'CA', 4965, 'Developed Information');
    INSERT INTO search VALUES (56000056, 'Y9200005', 9200005, 'NCRIM', 'N', 'Harris', 'CA', 4965, 'Developed Information');
    INSERT INTO search VALUES (56000060, 'Y9200006', 9200006, 'F/M', 'F', 'Cook', 'NA', 41, 'Discrepancy Found');
    INSERT INTO search VALUES (56000061, 'Y9200006', 9200006, 'F/M', 'F', 'NONE', 'NY', 41, 'Discrepancy Found');
    INSERT INTO search VALUES (56000062, 'Y9200006', 9200006, 'F/M', 'N', 'Los Angeles', 'IL', 41, 'Discrepancy Found');
    INSERT INTO search VALUES (56000063, 'Y9200006', 9200006, 'MOV', 'N', 'Harris', 'IL', 41, NULL);
    INSERT INTO search VALUES (56000064, 'Y9200006', 9200006, 'OFAC', 'N', 'Cook', 'NA', 41, NULL);
    INSERT INTO search VALUES (56000065, 'Y9200006', 9200006, 'FED-CR', 'F', 'Cook', 'CA', 41, 'Unable to Verify');
    INSERT INTO search VALUES (56000066, 'Y9200006', 9200006, 'MVR', 'N', 'NONE', 'NA', 41, NULL);
    INSERT INTO search VALUES (56000070, 'Y9200007', 9200007, 'ADJ', 'F', 'Los Angeles', 'CA', 6343, 'Unable to Verify');
    INSERT INTO search VALUES (56000071, 'Y9200007', 9200007, 'SON', 'F', 'Cook', 'TX', 6343, 'Discrepancy Found');
    INSERT INTO search VALUES (56000072, 'Y9200007', 9200007, 'F/M', 'F', 'NONE', 'TX', 6343, NULL);
    INSERT INTO search VALUES (56000073, 'Y9200007', 9200007, 'EDU', 'F', 'Los Angeles', 'TX', 6343, 'Developed Information');
    INSERT INTO search VALUES (56000074, 'Y9200007', 9200007, 'F/M', 'F', 'Los Angeles', 'NA', 6343, 'Discrepancy Found');
    INSERT INTO search VALUES (56000075, 'Y9200007', 9200007, 'EMP', 'N', 'Cook', 'NA', 6343, 'Developed Information');
    INSERT INTO search VALUES (56000076, 'Y9200007', 9200007, 'FED-CR', 'N', 'Cook', 'NA', 6343, NULL);
    INSERT INTO search VALUES (56000080, 'Y9200008', 9200008, 'EMP', 'F', 'Cook', 'NY', 2227, 'Developed Information');
    INSERT INTO search VALUES (56000081, 'Y9200008', 9200008, 'MOV', 'F', 'Cook', 'NY', 2227, 'Developed Information');
    INSERT INTO search VALUES (56000082, 'Y9200008', 9200008, 'MOV', 'N', 'Cook', 'TX', 2227, 'Developed Information');
    INSERT INTO search VALUES (56000083, 'Y9200008', 9200008, 'MVR', 'F', 'Los Angeles', 'TX', 2227, 'Unable to Verify');
    INSERT INTO search VALUES (56000084, 'Y9200008', 9200008, 'MOV', 'F', 'Cook', 'TX', 2227, NULL);
    INSERT INTO search VALUES (56000090, 'Y9200009', 9200009, 'NCRIM', 'N', 'Los Angeles', 'CA', 6343, 'Discrepancy Found');
    INSERT INTO search VALUES (56000091, 'Y9200009', 9200009, 'SON', 'F', 'Los Angeles', 'TX', 6343, NULL);
    INSERT INTO search VALUES (56000092, 'Y9200009', 9200009, 'OFAC', 'N', 'Harris', 'NY', 6343, 'Discrepancy Found');
    """
    try:
        with sqlite3.connect(file) as connection:
            print(f"Successfully connected to SQLite database '{file}'")
            cursor = connection.cursor()
            cursor.executescript(script)
            connection.commit()
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
        raise
    print("Database Addon complete.")

if __name__ == '__main__':
    crds()