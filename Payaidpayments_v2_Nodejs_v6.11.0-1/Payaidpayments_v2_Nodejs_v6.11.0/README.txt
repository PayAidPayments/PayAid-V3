<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeTix - AI-Powered RFP Intelligence Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 0; position: fixed; width: 100%; top: 0; z-index: 1000; }
        nav { display: flex; justify-content: space-between; align-items: center; }
        nav a { color: white; text-decoration: none; margin: 0 1rem; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 120px 0 80px; text-align: center; }
        .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.5rem; margin-bottom: 2rem; max-width: 800px; margin-left: auto; margin-right: auto; }
        .btn { display: inline-block; padding: 1rem 2rem; background: #ff6b6b; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 0.5rem; transition: transform 0.3s; }
        .btn:hover { transform: translateY(-2px); }
        .btn-secondary { background: transparent; border: 2px solid white; }
        section { padding: 80px 0; }
        .section-title { font-size: 2.5rem; text-align: center; margin-bottom: 3rem; color: #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
        .problem { background: #f8f9fa; }
        table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        footer { background: #333; color: white; text-align: center; padding: 2rem 0; }
        @media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div style="font-size: 1.5rem; font-weight: bold;">CodeTix</div>
            <div>
                <a href="#features">Features</a>
                <a href="#outcomes">Outcomes</a>
                <a href="#partners">Partners</a>
                <a href="#contact">Contact</a>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div class="container">
            <h1>AI-Powered RFP Intelligence</h1>
            <p>CodeTix turns complex RFP documents into structured, actionable intelligence. Accelerate proposals, reduce manual effort, improve accuracy.</p>
            <div>
                <a href="#demo" class="btn">Schedule Walkthrough</a>
                <a href="#download" class="btn btn-secondary">Download Overview</a>
            </div>
        </div>
    </section>

    <section id="problem" class="problem">
        <div class="container">
            <h2 class="section-title">RFP Management is Manual & Inefficient</h2>
            <div class="grid">
                <div class="card">
                    <h3>Document Complexity</h3>
                    <p>Multi-hundred-page documents with scattered requirements slow every response cycle.[file:3]</p>
                </div>
                <div class="card">
                    <h3>Manual Effort</h3>
                    <p>Tedious requirement extraction and data entry eats proposal team time.[file:3]</p>
                </div>
                <div class="card">
                    <h3>Compliance Risk</h3>
                    <p>Missed clauses and SLAs lead to disqualifications and lost opportunities.[file:3]</p>
                </div>
            </div>
        </div>
    </section>

    <section id="solution">
        <div class="container">
            <h2 class="section-title">The CodeTix Solution</h2>
            <div style="text-align: center; margin-bottom: 3rem;">
                <p>Powered by agentic AI: Specialized agents for understanding, extraction, and compliance collaborate for unmatched accuracy.[file:3]</p>
            </div>
            <div class="grid">
                <div class="card">
                    <h3>Ingestion & Classify</h3>
                    <p>Automated document ingestion and section classification for instant structure.[file:3]</p>
                </div>
                <div class="card">
                    <h3>Extraction & Detection</h3>
                    <p>Identify deliverables, scope, criteria, and SLA compliance automatically.[file:3]</p>
                </div>
                <div class="card">
                    <h3>Strategic Insights</h3>
                    <p>Convert unstructured data into actionable proposal intelligence.[file:3]</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 3rem;">
                <a href="#demo" class="btn">See CodeTix in Action</a>
            </div>
        </div>
    </section>

    <section id="features">
        <div class="container">
            <h2 class="section-title">Key Capabilities</h2>
            <ul style="max-width: 800px; margin: 0 auto; list-style: none;">
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">Intelligent document processing with section classification.[file:3]</li>
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">Automated extraction of requirements, deliverables, SLAs.[file:3]</li>
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">Compliance tracking and requirement traceability.[file:3]</li>
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">Reusable knowledge assets for faster future responses.[file:3]</li>
            </ul>
        </div>
    </section>

    <section id="outcomes" style="background: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Business Outcomes</h2>
            <table>
                <thead>
                    <tr><th>Capability</th><th>Outcome</th></tr>
                </thead>
                <tbody>
                    <tr><td>Automated Classification[file:3]</td><td>Instant RFP structure[file:3]</td></tr>
                    <tr><td>Entity Extraction[file:3]</td><td>Less manual reading[file:3]</td></tr>
                    <tr><td>Compliance Checks[file:3]</td><td>Lower risk[file:3]</td></tr>
                    <tr><td>Structured Insights[file:3]</td><td>Better win strategies[file:3]</td></tr>
                </tbody>
            </table>
        </div>
    </section>

    <section id="partners">
        <div class="container">
            <h2 class="section-title">For Resellers & Partners</h2>
            <div class="grid">
                <div class="card">
                    <h3>Launch Fast</h3>
                    <p>AI-enabled proposal services without building from scratch.[file:3]</p>
                </div>
                <div class="card">
                    <h3>White-Label</h3>
                    <p>Deploy on your domain or codetix.ai.[file:3]</p>
                </div>
                <div class="card">
                    <h3>New Revenue</h3>
                    <p>Automate manual tasks, increase margins.[file:3]</p>
                </div>
            </div>
        </div>
    </section>

    <section id="deployment" style="background: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Deployment Options</h2>
            <ul style="max-width: 800px; margin: 0 auto;">
                <li>Enterprise licensing or white-label SaaS[file:3]</li>
                <li>Seamless integration with CRM, CPQ systems[file:3]</li>
                <li>Product walkthrough + pilot implementation[file:3]</li>
            </ul>
            <div style="text-align: center; margin-top: 3rem;">
                <a href="#contact" class="btn">Contact Sales</a>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; 2026 CodeTix. AI-Powered RFP Intelligence at <a href="https://codetix.ai" style="color: #ff6b6b;">codetix.ai</a></p>
        </div>
    </footer>
</body>
</html>
