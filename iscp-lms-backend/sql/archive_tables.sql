-- Rename the existing archives table to legacy_archives for clarity
ALTER TABLE archives RENAME TO legacy_archives;

-- Create a new academic_archives table for academic year records
CREATE TABLE IF NOT EXISTS academic_archives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year VARCHAR(20) NOT NULL,
  semesters INT NOT NULL DEFAULT 2,
  courses INT NOT NULL DEFAULT 0,
  students INT NOT NULL DEFAULT 0,
  status ENUM('Current', 'Archived') DEFAULT 'Archived',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year (year)
);

-- Create a table for departments within academic archives
CREATE TABLE IF NOT EXISTS archive_departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  archive_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  courses INT NOT NULL DEFAULT 0,
  students INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES academic_archives(id) ON DELETE CASCADE
);

-- Create a table for campus data within academic archives
CREATE TABLE IF NOT EXISTS archive_campuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  archive_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  courses INT NOT NULL DEFAULT 0,
  students INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES academic_archives(id) ON DELETE CASCADE
);

-- Add some sample data to the academic_archives table
INSERT INTO academic_archives (year, semesters, courses, students, status) VALUES
('2023-2024', 2, 156, 4567, 'Current'),
('2022-2023', 2, 145, 4350, 'Archived'),
('2021-2022', 2, 138, 4125, 'Archived'),
('2020-2021', 2, 130, 3980, 'Archived'),
('2019-2020', 2, 125, 3750, 'Archived');

-- Add sample department data
INSERT INTO archive_departments (archive_id, name, courses, students) VALUES
(1, 'Computer Science', 35, 450),
(1, 'Engineering', 30, 380),
(1, 'Business', 28, 350),
(1, 'Liberal Arts', 25, 320),
(2, 'Computer Science', 32, 430),
(2, 'Engineering', 28, 365),
(2, 'Business', 27, 328),
(2, 'Liberal Arts', 24, 310);

-- Add sample campus data
INSERT INTO archive_campuses (archive_id, name, courses, students) VALUES
(1, 'Main Campus', 80, 2200),
(1, 'North Branch', 50, 1550),
(2, 'Main Campus', 75, 2100),
(2, 'North Branch', 48, 1500);

-- Add sample legacy archives if the table is empty
INSERT INTO legacy_archives (name, file_type, file_url, size, uploaded_by, campus, created_at)
SELECT 
  'Pre-Digital Records (2010-2015)', 
  'PDF Scans', 
  '/uploads/archives/pre_digital_records_2010_2015.zip', 
  16052577, 
  1, 
  'All Campuses',
  '2015-07-15 10:15:00'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM legacy_archives LIMIT 1);

INSERT INTO legacy_archives (name, file_type, file_url, size, uploaded_by, campus, created_at)
SELECT 
  'ISCP Legacy System Export', 
  'SQL + Documents', 
  '/uploads/archives/iscp_legacy_export.zip', 
  9123456, 
  1, 
  'All Campuses',
  '2018-01-20 14:30:00'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM legacy_archives WHERE id = 2);

INSERT INTO legacy_archives (name, file_type, file_url, size, uploaded_by, campus, created_at)
SELECT 
  'Historic Transcripts Archive', 
  'PDF + CSV', 
  '/uploads/archives/historic_transcripts.zip', 
  4403226, 
  1, 
  'All Campuses',
  '2017-12-05 09:45:00'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM legacy_archives WHERE id = 3);

INSERT INTO legacy_archives (name, file_type, file_url, size, uploaded_by, campus, created_at)
SELECT 
  'Alumni Database (2000-2018)', 
  'SQL Backup', 
  '/uploads/archives/alumni_db_2000_2018.zip', 
  3670016, 
  1, 
  'All Campuses',
  '2019-03-10 11:20:00'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM legacy_archives WHERE id = 4); 