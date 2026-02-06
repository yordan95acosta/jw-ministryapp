#!/usr/bin/env python3
"""
Ministry Hours Tracker Backend API Test Suite
Tests all backend endpoints for the preaching hours tracking app.
"""

import requests
import json
import uuid
from datetime import datetime, date
import time

# Backend URL from frontend .env
BACKEND_URL = "https://preachtrack.preview.emergentagent.com/api"

class MinistryHoursAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = {
            "crud_entries": False,
            "monthly_goals": False,
            "monthly_summary": False,
            "history": False,
            "export_import": False
        }
        self.created_entries = []
        self.created_goals = []
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_api_connection(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log("✅ API connection successful")
                return True
            else:
                self.log(f"❌ API connection failed: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ API connection error: {str(e)}")
            return False
    
    def test_crud_entries(self):
        """Test CRUD operations for entries"""
        self.log("🧪 Testing CRUD Entries API...")
        
        try:
            # Test CREATE entry
            entry_data = {
                "date": "2024-01-15",
                "hours": 2,
                "minutes": 30,
                "study_person_name": "Sarah Johnson",
                "notes": "Bible study on John 3:16"
            }
            
            response = requests.post(f"{self.base_url}/entries", json=entry_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ CREATE entry failed: {response.status_code} - {response.text}")
                return False
                
            created_entry = response.json()
            entry_id = created_entry["id"]
            self.created_entries.append(entry_id)
            self.log(f"✅ CREATE entry successful: {entry_id}")
            
            # Test READ all entries
            response = requests.get(f"{self.base_url}/entries", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ READ all entries failed: {response.status_code}")
                return False
            
            entries = response.json()
            self.log(f"✅ READ all entries successful: {len(entries)} entries found")
            
            # Test READ entries by date
            response = requests.get(f"{self.base_url}/entries/date/2024-01-15", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ READ entries by date failed: {response.status_code}")
                return False
                
            date_entries = response.json()
            self.log(f"✅ READ entries by date successful: {len(date_entries)} entries found")
            
            # Test UPDATE entry
            update_data = {
                "date": "2024-01-15",
                "hours": 3,
                "minutes": 0,
                "study_person_name": "Sarah Johnson",
                "notes": "Extended Bible study on John 3:16-21"
            }
            
            response = requests.put(f"{self.base_url}/entries/{entry_id}", json=update_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ UPDATE entry failed: {response.status_code} - {response.text}")
                return False
                
            updated_entry = response.json()
            if updated_entry["hours"] != 3:
                self.log(f"❌ UPDATE entry validation failed: hours not updated")
                return False
                
            self.log(f"✅ UPDATE entry successful")
            
            # Create additional entries for unique studies test
            additional_entries = [
                {
                    "date": "2024-01-16",
                    "hours": 1,
                    "minutes": 45,
                    "study_person_name": "sarah johnson",  # Same person, different case
                    "notes": "Follow-up study"
                },
                {
                    "date": "2024-01-17",
                    "hours": 2,
                    "minutes": 0,
                    "study_person_name": "Michael Brown",
                    "notes": "Initial Bible study"
                },
                {
                    "date": "2024-01-18",
                    "hours": 1,
                    "minutes": 30,
                    "study_person_name": "SARAH JOHNSON",  # Same person, uppercase
                    "notes": "Third study session"
                }
            ]
            
            for entry in additional_entries:
                response = requests.post(f"{self.base_url}/entries", json=entry, timeout=10)
                if response.status_code == 200:
                    self.created_entries.append(response.json()["id"])
            
            self.log(f"✅ Created additional entries for unique studies test")
            
            self.test_results["crud_entries"] = True
            return True
            
        except Exception as e:
            self.log(f"❌ CRUD entries test error: {str(e)}")
            return False
    
    def test_monthly_goals(self):
        """Test monthly goal API"""
        self.log("🧪 Testing Monthly Goals API...")
        
        try:
            # Test SET goal (preset: 30 hours)
            goal_data = {
                "year": 2024,
                "month": 1,
                "hours_goal": 30
            }
            
            response = requests.post(f"{self.base_url}/goals", json=goal_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ SET goal failed: {response.status_code} - {response.text}")
                return False
                
            created_goal = response.json()
            self.log(f"✅ SET goal successful: {created_goal['hours_goal']} hours")
            
            # Test GET goal
            response = requests.get(f"{self.base_url}/goals/2024/1", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ GET goal failed: {response.status_code}")
                return False
                
            retrieved_goal = response.json()
            if retrieved_goal and retrieved_goal["hours_goal"] != 30:
                self.log(f"❌ GET goal validation failed: expected 30, got {retrieved_goal['hours_goal']}")
                return False
                
            self.log(f"✅ GET goal successful")
            
            # Test UPDATE existing goal (preset: 50 hours)
            update_goal_data = {
                "year": 2024,
                "month": 1,
                "hours_goal": 50
            }
            
            response = requests.post(f"{self.base_url}/goals", json=update_goal_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ UPDATE goal failed: {response.status_code}")
                return False
                
            # Verify update
            response = requests.get(f"{self.base_url}/goals/2024/1", timeout=10)
            updated_goal = response.json()
            if updated_goal["hours_goal"] != 50:
                self.log(f"❌ UPDATE goal validation failed: expected 50, got {updated_goal['hours_goal']}")
                return False
                
            self.log(f"✅ UPDATE goal successful: {updated_goal['hours_goal']} hours")
            
            # Test custom goal (15 hours)
            custom_goal_data = {
                "year": 2024,
                "month": 2,
                "hours_goal": 15
            }
            
            response = requests.post(f"{self.base_url}/goals", json=custom_goal_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ SET custom goal failed: {response.status_code}")
                return False
                
            self.log(f"✅ SET custom goal successful: 15 hours")
            
            self.test_results["monthly_goals"] = True
            return True
            
        except Exception as e:
            self.log(f"❌ Monthly goals test error: {str(e)}")
            return False
    
    def test_monthly_summary(self):
        """Test monthly summary API with unique studies count"""
        self.log("🧪 Testing Monthly Summary API...")
        
        try:
            # Get summary for January 2024
            response = requests.get(f"{self.base_url}/summary/2024/1", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ GET monthly summary failed: {response.status_code}")
                return False
                
            summary = response.json()
            
            # Validate summary structure
            required_fields = ["year", "month", "total_hours", "total_minutes", "unique_studies", "study_names", "hours_goal", "entries_count"]
            for field in required_fields:
                if field not in summary:
                    self.log(f"❌ Monthly summary missing field: {field}")
                    return False
            
            self.log(f"✅ Monthly summary structure valid")
            
            # Validate unique studies count (should be 2: Sarah Johnson and Michael Brown)
            # Sarah Johnson appears 3 times but should count as 1 unique study
            expected_unique_studies = 2
            if summary["unique_studies"] != expected_unique_studies:
                self.log(f"❌ Unique studies count incorrect: expected {expected_unique_studies}, got {summary['unique_studies']}")
                self.log(f"Study names found: {summary['study_names']}")
                return False
                
            self.log(f"✅ Unique studies count correct: {summary['unique_studies']}")
            
            # Validate study names (should be case-insensitive)
            study_names = [name.lower() for name in summary["study_names"]]
            if "sarah johnson" not in study_names or "michael brown" not in study_names:
                self.log(f"❌ Study names incorrect: {summary['study_names']}")
                return False
                
            self.log(f"✅ Study names correct: {summary['study_names']}")
            
            # Validate total hours calculation
            # Entry 1: 3h 0m, Entry 2: 1h 45m, Entry 3: 2h 0m, Entry 4: 1h 30m = 7h 75m = 8h 15m
            expected_total_hours = 8
            expected_total_minutes = 15
            
            if summary["total_hours"] != expected_total_hours or summary["total_minutes"] != expected_total_minutes:
                self.log(f"❌ Time calculation incorrect: expected {expected_total_hours}h {expected_total_minutes}m, got {summary['total_hours']}h {summary['total_minutes']}m")
                return False
                
            self.log(f"✅ Time calculation correct: {summary['total_hours']}h {summary['total_minutes']}m")
            
            # Validate goal
            if summary["hours_goal"] != 50:  # We updated it to 50 in previous test
                self.log(f"❌ Hours goal incorrect: expected 50, got {summary['hours_goal']}")
                return False
                
            self.log(f"✅ Hours goal correct: {summary['hours_goal']}")
            
            self.test_results["monthly_summary"] = True
            return True
            
        except Exception as e:
            self.log(f"❌ Monthly summary test error: {str(e)}")
            return False
    
    def test_history_api(self):
        """Test history API"""
        self.log("🧪 Testing History API...")
        
        try:
            response = requests.get(f"{self.base_url}/history", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ GET history failed: {response.status_code}")
                return False
                
            history = response.json()
            
            if not isinstance(history, list):
                self.log(f"❌ History should be a list, got {type(history)}")
                return False
                
            self.log(f"✅ History API successful: {len(history)} months found")
            
            # Validate history contains our test month
            january_found = False
            for month_summary in history:
                if month_summary.get("year") == 2024 and month_summary.get("month") == 1:
                    january_found = True
                    # Validate it has the same structure as monthly summary
                    required_fields = ["year", "month", "total_hours", "total_minutes", "unique_studies", "study_names", "hours_goal", "entries_count"]
                    for field in required_fields:
                        if field not in month_summary:
                            self.log(f"❌ History month summary missing field: {field}")
                            return False
                    break
            
            if not january_found:
                self.log(f"❌ January 2024 not found in history")
                return False
                
            self.log(f"✅ History contains expected data")
            
            self.test_results["history"] = True
            return True
            
        except Exception as e:
            self.log(f"❌ History API test error: {str(e)}")
            return False
    
    def test_export_import(self):
        """Test export and import functionality"""
        self.log("🧪 Testing Export/Import API...")
        
        try:
            # Test EXPORT
            response = requests.get(f"{self.base_url}/export", timeout=10)
            if response.status_code != 200:
                self.log(f"❌ EXPORT failed: {response.status_code}")
                return False
                
            export_data = response.json()
            
            # Validate export structure
            required_fields = ["entries", "goals", "export_date"]
            for field in required_fields:
                if field not in export_data:
                    self.log(f"❌ Export missing field: {field}")
                    return False
            
            self.log(f"✅ Export structure valid")
            
            # Validate export contains our test data
            if len(export_data["entries"]) < 4:  # We created 4 entries
                self.log(f"❌ Export entries count incorrect: expected at least 4, got {len(export_data['entries'])}")
                return False
                
            if len(export_data["goals"]) < 2:  # We created 2 goals
                self.log(f"❌ Export goals count incorrect: expected at least 2, got {len(export_data['goals'])}")
                return False
                
            self.log(f"✅ Export data contains expected entries and goals")
            
            # Test IMPORT with duplicate data (should skip duplicates)
            import_data = {
                "entries": export_data["entries"][:2],  # Import first 2 entries (duplicates)
                "goals": export_data["goals"][:1]       # Import first goal (duplicate)
            }
            
            response = requests.post(f"{self.base_url}/import", json=import_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ IMPORT failed: {response.status_code} - {response.text}")
                return False
                
            import_result = response.json()
            
            # Validate import result
            if "imported_entries" not in import_result or "imported_goals" not in import_result:
                self.log(f"❌ Import result missing fields")
                return False
            
            # Should import 0 entries and 0 goals (all duplicates)
            if import_result["imported_entries"] != 0 or import_result["imported_goals"] != 0:
                self.log(f"❌ Import should skip duplicates: imported {import_result['imported_entries']} entries, {import_result['imported_goals']} goals")
                return False
                
            self.log(f"✅ Import correctly skipped duplicates")
            
            # Test import with new data
            new_entry = {
                "date": "2024-02-01",
                "hours": 1,
                "minutes": 0,
                "study_person_name": "Emma Wilson",
                "notes": "New Bible study"
            }
            
            new_goal = {
                "year": 2024,
                "month": 3,
                "hours_goal": 25
            }
            
            import_new_data = {
                "entries": [new_entry],
                "goals": [new_goal]
            }
            
            response = requests.post(f"{self.base_url}/import", json=import_new_data, timeout=10)
            if response.status_code != 200:
                self.log(f"❌ IMPORT new data failed: {response.status_code}")
                return False
                
            import_new_result = response.json()
            
            if import_new_result["imported_entries"] != 1 or import_new_result["imported_goals"] != 1:
                self.log(f"❌ Import new data failed: expected 1 entry and 1 goal, got {import_new_result['imported_entries']} entries, {import_new_result['imported_goals']} goals")
                return False
                
            self.log(f"✅ Import new data successful")
            
            self.test_results["export_import"] = True
            return True
            
        except Exception as e:
            self.log(f"❌ Export/Import test error: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        self.log("🧹 Cleaning up test data...")
        
        # Delete created entries
        for entry_id in self.created_entries:
            try:
                requests.delete(f"{self.base_url}/entries/{entry_id}", timeout=5)
            except:
                pass
        
        self.log(f"✅ Cleanup completed")
    
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting Ministry Hours Tracker Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        # Test API connection first
        if not self.test_api_connection():
            self.log("❌ Cannot proceed - API not accessible")
            return False
        
        # Run all tests
        tests = [
            ("CRUD Entries", self.test_crud_entries),
            ("Monthly Goals", self.test_monthly_goals),
            ("Monthly Summary", self.test_monthly_summary),
            ("History API", self.test_history_api),
            ("Export/Import", self.test_export_import)
        ]
        
        all_passed = True
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*50}")
            try:
                if not test_func():
                    all_passed = False
                    self.log(f"❌ {test_name} FAILED")
                else:
                    self.log(f"✅ {test_name} PASSED")
            except Exception as e:
                self.log(f"❌ {test_name} ERROR: {str(e)}")
                all_passed = False
        
        # Print summary
        self.log(f"\n{'='*50}")
        self.log("📊 TEST SUMMARY")
        self.log(f"{'='*50}")
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        if all_passed:
            self.log("\n🎉 ALL TESTS PASSED!")
        else:
            self.log("\n💥 SOME TESTS FAILED!")
        
        # Cleanup
        self.cleanup_test_data()
        
        return all_passed

if __name__ == "__main__":
    tester = MinistryHoursAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)