# Templates Documentation

This document details the Templates functionality of the Hype Knowledge API, explaining how to create, use, and manage response templates for structured content generation.

## Overview

The Templates module allows you to define structured response formats that can be populated with content from your knowledge base. Templates are particularly useful for:

- Creating consistent responses for common queries
- Generating structured content like FAQs, product descriptions, or documentation sections
- Building interactive conversational experiences with predictable output formats
- Customizing the presentation of retrieved knowledge

## Templates Structure

Templates use a flexible JSON-based structure with variables that are populated from retrieval results:

```json
{
  "name": "product_description",
  "description": "Template for generating product descriptions from knowledge base content",
  "template": "# {{product.name}}\n\n## Overview\n\n{{product.summary}}\n\n## Key Features\n\n{{product.features}}\n\n## Technical Specifications\n\n{{product.specifications}}\n\n## Pricing\n\n{{product.pricing}}",
  "variables": [
    {
      "name": "product.name",
      "description": "The name of the product",
      "required": true,
      "query": "What is the name of product {{input.productId}}?"
    },
    {
      "name": "product.summary",
      "description": "Brief overview of the product",
      "required": true,
      "query": "Provide a brief summary of product {{input.productId}}",
      "maxTokens": 150
    },
    {
      "name": "product.features",
      "description": "Bullet-point list of product features",
      "required": true,
      "query": "List the main features of product {{input.productId}} as bullet points",
      "format": "markdown-list"
    },
    {
      "name": "product.specifications",
      "description": "Technical specifications as a formatted table",
      "required": false,
      "query": "Provide technical specifications for product {{input.productId}} in a table format",
      "format": "markdown-table"
    },
    {
      "name": "product.pricing",
      "description": "Pricing information",
      "required": false,
      "query": "What is the pricing for product {{input.productId}}?",
      "fallback": "Contact sales for pricing information."
    }
  ],
  "metadata": {
    "version": "1.0",
    "category": "product",
    "author": "Product Marketing Team"
  }
}
```

## Endpoints

### Create Template

```
POST /api/templates
```

Create a new response template.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "faq_response",
  "description": "Standard FAQ response format",
  "template": "## {{question}}\n\n{{answer}}\n\n### Related Questions\n\n{{related_questions}}",
  "variables": [
    {
      "name": "question",
      "description": "The FAQ question",
      "required": true,
      "query": "{{input.question}}"
    },
    {
      "name": "answer",
      "description": "The answer to the FAQ question",
      "required": true,
      "query": "{{input.question}}",
      "maxTokens": 300
    },
    {
      "name": "related_questions",
      "description": "Related questions the user might want to ask",
      "required": false,
      "query": "List 3 questions related to \"{{input.question}}\" that the user might want to ask next",
      "format": "markdown-list"
    }
  ],
  "metadata": {
    "category": "support",
    "language": "english"
  }
}
```

**Response:**
```json
{
  "success": true,
  "templateId": "template-123456",
  "name": "faq_response",
  "message": "Template created successfully"
}
```

### List Templates

```
GET /api/templates
```

Retrieve a list of all available templates.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of templates per page (default: 20)
- `category` (optional): Filter templates by category
- `searchTerm` (optional): Search for templates by name or description

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "template-123456",
      "name": "faq_response",
      "description": "Standard FAQ response format",
      "metadata": {
        "category": "support",
        "language": "english"
      },
      "createdAt": "2023-04-15T13:45:22Z",
      "updatedAt": "2023-04-15T13:45:22Z"
    },
    {
      "id": "template-789012",
      "name": "product_description",
      "description": "Template for generating product descriptions from knowledge base content",
      "metadata": {
        "version": "1.0",
        "category": "product",
        "author": "Product Marketing Team"
      },
      "createdAt": "2023-03-10T09:22:15Z",
      "updatedAt": "2023-03-12T14:30:45Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

### Get Template

```
GET /api/templates/:templateId
```

Retrieve a specific template by ID.

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template-123456",
    "name": "faq_response",
    "description": "Standard FAQ response format",
    "template": "## {{question}}\n\n{{answer}}\n\n### Related Questions\n\n{{related_questions}}",
    "variables": [
      {
        "name": "question",
        "description": "The FAQ question",
        "required": true,
        "query": "{{input.question}}"
      },
      {
        "name": "answer",
        "description": "The answer to the FAQ question",
        "required": true,
        "query": "{{input.question}}",
        "maxTokens": 300
      },
      {
        "name": "related_questions",
        "description": "Related questions the user might want to ask",
        "required": false,
        "query": "List 3 questions related to \"{{input.question}}\" that the user might want to ask next",
        "format": "markdown-list"
      }
    ],
    "metadata": {
      "category": "support",
      "language": "english"
    },
    "createdAt": "2023-04-15T13:45:22Z",
    "updatedAt": "2023-04-15T13:45:22Z"
  }
}
```

### Update Template

```
PUT /api/templates/:templateId
```

Update an existing template.

**Request Body:**
```json
{
  "description": "Updated FAQ response format with sources",
  "template": "## {{question}}\n\n{{answer}}\n\n### Sources\n\n{{sources}}\n\n### Related Questions\n\n{{related_questions}}",
  "variables": [
    {
      "name": "question",
      "description": "The FAQ question",
      "required": true,
      "query": "{{input.question}}"
    },
    {
      "name": "answer",
      "description": "The answer to the FAQ question",
      "required": true,
      "query": "{{input.question}}",
      "maxTokens": 300
    },
    {
      "name": "sources",
      "description": "Sources of information for the answer",
      "required": true,
      "query": "List the sources for the answer to \"{{input.question}}\"",
      "format": "markdown-list"
    },
    {
      "name": "related_questions",
      "description": "Related questions the user might want to ask",
      "required": false,
      "query": "List 3 questions related to \"{{input.question}}\" that the user might want to ask next",
      "format": "markdown-list"
    }
  ],
  "metadata": {
    "category": "support",
    "language": "english",
    "version": "1.1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "templateId": "template-123456",
  "message": "Template updated successfully"
}
```

### Delete Template

```
DELETE /api/templates/:templateId
```

Delete a template.

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Apply Template

```
POST /api/templates/:templateId/apply
```

Apply a template to generate a structured response.

**Request Body:**
```json
{
  "input": {
    "question": "How do I reset my password?"
  },
  "retrievalOptions": {
    "rewriteQuery": true,
    "strategy": "HYBRID",
    "filters": {
      "metadata.category": "user-management"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "content": "## How do I reset my password?\n\nTo reset your password, follow these steps:\n\n1. Click on the 'Forgot Password' link on the login page\n2. Enter the email address associated with your account\n3. Check your email for a password reset link\n4. Click the link and follow the instructions to create a new password\n5. Log in with your new password\n\n### Sources\n\n- User Management Documentation, Section 2.3\n- Help Center Article #145: Password Reset Procedure\n- Security Guidelines v2.1\n\n### Related Questions\n\n- What should I do if I don't receive the password reset email?\n- How often should I change my password?\n- What are the requirements for a strong password?",
    "variables": {
      "question": "How do I reset my password?",
      "answer": "To reset your password, follow these steps:\n\n1. Click on the 'Forgot Password' link on the login page\n2. Enter the email address associated with your account\n3. Check your email for a password reset link\n4. Click the link and follow the instructions to create a new password\n5. Log in with your new password",
      "sources": "- User Management Documentation, Section 2.3\n- Help Center Article #145: Password Reset Procedure\n- Security Guidelines v2.1",
      "related_questions": "- What should I do if I don't receive the password reset email?\n- How often should I change my password?\n- What are the requirements for a strong password?"
    },
    "metadata": {
      "templateId": "template-123456",
      "templateName": "faq_response",
      "timeTaken": 1.24,
      "generatedAt": "2023-05-20T15:30:45Z"
    }
  }
}
```

## Template Variables

Each template variable can have the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the variable within the template |
| `description` | string | Yes | Description of what the variable represents |
| `required` | boolean | No | Whether the variable must be populated (default: false) |
| `query` | string | Yes | The query to execute against the knowledge base to populate this variable |
| `maxTokens` | number | No | Maximum length of the response in tokens (default: system-defined) |
| `format` | string | No | Output format specifier (e.g., "markdown-list", "markdown-table", "json") |
| `fallback` | string | No | Default text to use if the query returns no results |
| `filters` | object | No | Metadata filters to apply to this specific variable's retrieval |
| `strategy` | string | No | Retrieval strategy override for this variable ("VECTOR", "GRAPH", "HYBRID") |

## Template Input Variables

Templates can reference input variables provided at runtime using the `{{input.variableName}}` syntax:

```json
{
  "name": "customer_support",
  "template": "Dear {{input.customerName}},\n\nThank you for your inquiry about {{input.productName}}.\n\n{{answer}}\n\nBest regards,\nSupport Team",
  "variables": [
    {
      "name": "answer",
      "description": "Answer to the customer's question",
      "required": true,
      "query": "{{input.question}} regarding {{input.productName}}"
    }
  ]
}
```

When applying this template, you would provide:

```json
{
  "input": {
    "customerName": "John Smith",
    "productName": "Smart Home Hub",
    "question": "How do I connect to WiFi"
  }
}
```

## Formatting Options

Templates support various formatting options through the `format` property:

| Format | Description | Example |
|--------|-------------|---------|
| `text` | Plain text (default) | Simple text without formatting |
| `markdown` | General Markdown formatting | Headers, lists, bold, etc. |
| `markdown-list` | Specifically formats as a Markdown list | Bulleted or numbered lists |
| `markdown-table` | Specifically formats as a Markdown table | Tabular data presentation |
| `json` | Returns data as a structured JSON object | For programmatic consumption |
| `html` | Returns HTML formatted content | For direct web embedding |

## Conditional Logic

Templates support simple conditional logic using the `{{#if variable}}...{{/if}}` syntax:

```
{{#if product.pricing}}
## Pricing

{{product.pricing}}
{{else}}
## Pricing

Pricing information is currently unavailable. Please contact sales.
{{/if}}
```

## Usage Examples

### Creating a Template with JavaScript

```javascript
async function createTemplate(templateData) {
  const response = await fetch('https://your-api-hostname.com/api/templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  });
  
  return await response.json();
}

// Example usage
const productDescriptionTemplate = {
  name: "product_description",
  description: "Product description generator",
  template: "# {{product.name}}\n\n{{product.summary}}\n\n## Features\n\n{{product.features}}\n\n{{#if product.pricing}}## Pricing\n\n{{product.pricing}}{{/if}}",
  variables: [
    {
      name: "product.name",
      description: "Product name",
      required: true,
      query: "{{input.productId}} product name"
    },
    {
      name: "product.summary",
      description: "Product summary",
      required: true,
      query: "Provide a summary of {{input.productId}}",
      maxTokens: 200
    },
    {
      name: "product.features",
      description: "Product features",
      required: true,
      query: "List the main features of {{input.productId}}",
      format: "markdown-list"
    },
    {
      name: "product.pricing",
      description: "Product pricing",
      required: false,
      query: "What is the pricing for {{input.productId}}?",
      fallback: "Contact sales for pricing information."
    }
  ],
  metadata: {
    category: "marketing",
    department: "Product"
  }
};

createTemplate(productDescriptionTemplate)
  .then(result => console.log('Template created:', result))
  .catch(error => console.error('Error creating template:', error));
```

### Applying a Template with JavaScript

```javascript
async function applyTemplate(templateId, inputData, retrievalOptions = {}) {
  const response = await fetch(`https://your-api-hostname.com/api/templates/${templateId}/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: inputData,
      retrievalOptions
    })
  });
  
  return await response.json();
}

// Example usage
applyTemplate(
  'template-123456',
  { productId: 'smart-home-hub', market: 'consumer' },
  { 
    strategy: 'HYBRID',
    filters: { "metadata.department": "Product" }
  }
)
  .then(result => {
    console.log('Generated content:', result.result.content);
    
    // You could insert the content into the page
    document.getElementById('product-description').innerHTML = result.result.content;
  })
  .catch(error => console.error('Error applying template:', error));
```

### Displaying a Template Selection UI

```javascript
async function loadTemplateOptions() {
  const response = await fetch('https://your-api-hostname.com/api/templates?category=customer-support', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  const templates = data.templates || [];
  
  const selectElement = document.getElementById('template-selector');
  selectElement.innerHTML = '<option value="">Select a template...</option>';
  
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name + ' - ' + template.description;
    selectElement.appendChild(option);
  });
  
  // Add change event listener
  selectElement.addEventListener('change', (event) => {
    const selectedTemplateId = event.target.value;
    if (selectedTemplateId) {
      fetchTemplateDetails(selectedTemplateId);
    }
  });
}

async function fetchTemplateDetails(templateId) {
  const response = await fetch(`https://your-api-hostname.com/api/templates/${templateId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  if (data.success && data.template) {
    displayTemplateInputForm(data.template);
  }
}

function displayTemplateInputForm(template) {
  const formContainer = document.getElementById('template-input-form');
  formContainer.innerHTML = '';
  
  const form = document.createElement('form');
  form.id = 'apply-template-form';
  
  // Create input fields for each template input referenced in variables
  const inputVariables = new Set();
  
  template.variables.forEach(variable => {
    const queryStr = variable.query || '';
    const matches = queryStr.match(/{{input\.([a-zA-Z0-9_]+)}}/g) || [];
    
    matches.forEach(match => {
      const inputName = match.match(/{{input\.([a-zA-Z0-9_]+)}}/)[1];
      inputVariables.add(inputName);
    });
  });
  
  // Create form fields
  inputVariables.forEach(inputVar => {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = `input-${inputVar}`;
    label.textContent = inputVar.charAt(0).toUpperCase() + inputVar.slice(1).replace(/([A-Z])/g, ' $1');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `input-${inputVar}`;
    input.name = inputVar;
    input.className = 'form-control';
    input.required = true;
    
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    form.appendChild(formGroup);
  });
  
  // Add submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn btn-primary';
  submitButton.textContent = 'Generate Content';
  form.appendChild(submitButton);
  
  // Add submit handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData(form);
    const inputData = {};
    
    formData.forEach((value, key) => {
      inputData[key] = value;
    });
    
    try {
      const result = await applyTemplate(template.id, inputData);
      document.getElementById('template-result').innerHTML = result.result.content;
    } catch (error) {
      console.error('Error applying template:', error);
    }
  });
  
  formContainer.appendChild(form);
}

// Initialize the template selector
document.addEventListener('DOMContentLoaded', loadTemplateOptions);
```

## Best Practices

1. **Template Design**:
   - Keep templates focused on specific use cases
   - Use clear, descriptive variable names
   - Provide helpful fallback content for optional variables
   - Design templates to be reusable across different inputs
   - Use conditional sections for optional content

2. **Query Formulation**:
   - Write specific, focused queries for each variable
   - Reference input variables to make templates dynamic
   - Use query structuring to guide the response format
   - Consider the knowledge domain when formulating queries

3. **Content Formatting**:
   - Use appropriate format specifiers for different content types
   - Keep markup consistent throughout the template
   - Use formatting that aligns with your application's design
   - Test templates across different screen sizes and devices

4. **Performance Considerations**:
   - Limit the number of variables in a template
   - Set appropriate max token limits for responses
   - Enable caching when applying templates with the same inputs
   - Consider asynchronous template application for complex templates

## Troubleshooting

1. **Empty or Incomplete Variables**:
   - Check that the query references existing knowledge in your database
   - Ensure input variables are properly passed when applying the template
   - Add fallback values for potentially empty variables
   - Adjust retrieval filters if they're too restrictive

2. **Formatting Issues**:
   - Verify the format specifier is appropriate for the expected content
   - Check the template syntax for errors in variable references
   - Ensure conditional sections have proper opening and closing tags
   - Test the template with different inputs to identify edge cases

3. **Performance Problems**:
   - Reduce the number of variables in the template
   - Optimize queries to be more specific
   - Use more targeted filters for each variable
   - Consider breaking complex templates into multiple simpler templates

## Related Documentation

- [Retrieve Documentation](retrieve.md) - Learn about the retrieval capabilities used by templates
- [Knowledge Graph Documentation](knowledge.md) - Understanding how knowledge graphs enhance template responses 