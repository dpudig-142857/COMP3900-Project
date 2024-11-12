# Mingsim Chong z5402493
# COMP3900

# 1. Data Preparation
# You have a matrix of metabolomics data, where rows represent different metabolites, and columns represent samples.
# Label the samples as disease or control

# 2. Calculate Fold Change
# Fold change is a measure of the difference in metabolite abundance between two conditions.
# For each metabolite, calculate the mean abundance in disease samples and in control samples.
# Calculate the fold change as: Mean(Disease)/Mean(Control)
# Positive values (>0) indicate higher abundance in the disease group.
# Negative values (<0) indicate higher abundance in the control group.

# 3. Perform Statistical Testing (e.g., t-test)
# To test if the observed differences are statistically significant, use a t-test (for normally distributed data)
# For each metabolite, compare the distributions of disease vs. control using a two-sample t-test:

# Null hypothesis: there is no difference between the two groups.
# Calculate the p-value for each metabolite, representing the probability that the observed difference is due to random variation.

if (!require("writexl")) install.packages("writexl")
if (!require("readxl")) install.packages("readxl")
if (!require("dplyr")) install.packages("dplyr")
if (!require("tidyverse")) install.packages("tidyverse")
library(writexl)
library(readxl)
library(dplyr)
library(tidyverse)

WD <- "/Users/Kate/Documents/COMP3900"
setwd(WD)

# Loading file paths to Excel files that contain mass spectrometry data
file_paths <- list(
  "CVG-CVH-C18-Neg.xlsx",
  "CVG-CVH-C18-Pos.xlsx",
  "CVG-CVH-HILIC-Neg.xlsx",
  "CVG-CVH-HILIC-Pos.xlsx"
)

combined_data <- list()
for (file_path in file_paths) {
  df <- read_excel(file_path, sheet = "Compounds")
  
  # Data processing
  df <- df %>% filter(!grepl("checked", Name, ignore.case = TRUE)) %>%
    filter(!grepl("false", Name, ignore.case = TRUE))
  
  # Identify columns that begin with "CVG" or "CVH" (sample columns)
  # Exclude columns that contain "Pool" or "Blank" in the name
  data_columns <- grep("^(CVG|CVH)", colnames(df), value = TRUE)
  data_columns <- data_columns[!grepl("Pool|Blank", data_columns)]
  
  # Select columns for "Name" and sample data for processing
  df_data <- df %>% select(Name, all_of(data_columns))
  
  # Group by metabolite name
  grouped_results <- df_data %>%
    group_by(Name) %>%
    summarize(
      CVG_Values = list(as.numeric(unlist(select(cur_data(), starts_with("CVG"))))),
      CVH_Values = list(as.numeric(unlist(select(cur_data(), starts_with("CVH")))))
    )
  
  # Data frame
  results <- data.frame(
    Metabolite = grouped_results$Name,
    FoldChange = NA,
    Log2FoldChange = NA,
    PValue = NA,
    CVG_Count = NA,
    CVH_Count = NA,
    Status = NA,
    Regulation = NA
  )
  
  # Calculate fold change, log2 fold change, and p-value for each metabolite
  for (i in 1:nrow(grouped_results)) {
    cvg_values <- unlist(grouped_results$CVG_Values[i])
    cvh_values <- unlist(grouped_results$CVH_Values[i])
    
    # Count non-missing values in each group to ensure enough samples for testing
    cvg_count <- sum(!is.na(cvg_values))
    cvh_count <- sum(!is.na(cvh_values))
    results$CVG_Count[i] <- cvg_count
    results$CVH_Count[i] <- cvh_count
    
    # Check if there are enough samples in each group (minimum 3)
    if (cvg_count < 3 || cvh_count < 3) {
      results$Status[i] <- "Insufficient Data"
    } else if (var(cvg_values, na.rm = TRUE) == 0 || var(cvh_values, na.rm = TRUE) == 0) {
      # Check for constant data (no variation in the group)
      results$Status[i] <- "Constant Data"
    } else {
      # Calculate mean abundance for disease (CVG) and control (CVH)
      mean_cvg <- mean(cvg_values, na.rm = TRUE)
      mean_cvh <- mean(cvh_values, na.rm = TRUE)
      
      # Calculate fold change as the ratio of disease mean to control mean
      fold_change <- mean_cvg / mean_cvh
      
      # Take log2 of fold change for easier interpretation
      log2_fold_change <- log2(fold_change)
      
      # Determine the regulation type based on log2 fold change
      regulation <- ifelse(log2_fold_change > 0, "Upregulated", "Downregulated")
      
      # Perform a two-sample t-test to compare the groups
      t_test <- t.test(cvg_values, cvh_values, alternative = "two.sided", var.equal = TRUE)
      
      # Store the fold change, log2 fold change, p-value, and regulation status
      results$FoldChange[i] <- fold_change
      results$Log2FoldChange[i] <- log2_fold_change
      results$PValue[i] <- t_test$p.value
      results$Status[i] <- "Sufficient Data"
      results$Regulation[i] <- regulation
    }
  }
  
  results$Source <- sub(".xlsx", "", basename(file_path))
  combined_data[[file_path]] <- results
  output_file <- paste0("results-", sub(".xlsx", "", basename(file_path)), "-updated.xlsx")
  write_xlsx(results, output_file)
}

final_combined_data <- bind_rows(combined_data)
write_xlsx(final_combined_data, "sig_ranked_combined.xlsx")

if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)
write_json(final_combined_data, "sig_ranked.json")



