export function TermsEN({ privacyHref }: { privacyHref: string }) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="prose prose-lg max-w-none">
                <p className="text-sm text-muted-foreground mb-8">
                    Last updated: November 17, 2025
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-4">
                        By accessing and using the National AI Olympiad platform (hereinafter
                        referred to as the "Platform"), you agree to comply with and be bound by
                        these Terms and Conditions. If you do not agree with these terms, please do
                        not use the Platform.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                    <p className="mb-4">
                        The Platform provides an educational environment for participants in the
                        National AI Olympiad, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Access to artificial intelligence problems and exercises</li>
                        <li>Automatic solution evaluation system</li>
                        <li>Leaderboards and statistics</li>
                        <li>Discussion forums and Q&A</li>
                        <li>Educational materials and resources</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                    <h3 className="text-xl font-semibold mb-3">3.1 Eligibility</h3>
                    <p className="mb-4">
                        To use the Platform, you must be at least 13 years old or have
                        parental/legal guardian consent if under 18 years old.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">3.2 Account Information</h3>
                    <p className="mb-4">You are responsible for:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Providing accurate and complete information during registration</li>
                        <li>Maintaining the security of your account and password</li>
                        <li>All activities that occur under your account</li>
                        <li>Immediately notifying us of any unauthorized use of your account</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Platform Usage</h2>
                    <h3 className="text-xl font-semibold mb-3">4.1 Permitted Use</h3>
                    <p className="mb-4">You are permitted to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Access and solve available problems</li>
                        <li>Submit solutions for evaluation</li>
                        <li>Participate in discussions and forums</li>
                        <li>View leaderboards and statistics</li>
                        <li>Use educational materials for personal purposes</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">4.2 Prohibited Use</h3>
                    <p className="mb-4">It is strictly prohibited to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Copy or plagiarize other users' solutions</li>
                        <li>Attempt to compromise the Platform's security</li>
                        <li>Use automated scripts or bots to submit solutions</li>
                        <li>Distribute or publish problem solutions during competitions</li>
                        <li>Harass, threaten, or discriminate against other users</li>
                        <li>Upload illegal, offensive, or inappropriate content</li>
                        <li>Attempt to access other users' accounts</li>
                        <li>Use the Platform for commercial purposes without authorization</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
                    <h3 className="text-xl font-semibold mb-3">5.1 Platform Content</h3>
                    <p className="mb-4">
                        All problems, educational materials, design, and Platform content are the
                        property of the National AI Olympiad and are protected by copyright laws.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">5.2 User Content</h3>
                    <p className="mb-4">
                        By submitting solutions, comments, or other content to the Platform:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>You retain copyright to your code</li>
                        <li>
                            You grant the Platform a non-exclusive license to use, store, and
                            display the content
                        </li>
                        <li>You warrant that you have the right to publish such content</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Evaluation and Leaderboards</h2>
                    <h3 className="text-xl font-semibold mb-3">6.1 Evaluation System</h3>
                    <p className="mb-4">
                        Solutions are automatically evaluated based on predefined tests. The
                        evaluation system's decision is final, except in cases where technical
                        errors are identified.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">6.2 Leaderboards</h3>
                    <p className="mb-4">
                        Leaderboards are calculated based on scores obtained. We reserve the right
                        to:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Remove users who violate the rules from the leaderboard</li>
                        <li>Adjust scores in case of technical errors</li>
                        <li>Modify the leaderboard calculation algorithm</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
                    <p className="mb-4">
                        We collect and process your personal data in accordance with the General
                        Data Protection Regulation (GDPR). For complete details, please consult our{' '}
                        <a href={privacyHref} className="text-primary hover:underline">
                            Privacy Policy
                        </a>
                        .
                    </p>
                    <p className="mb-4">Collected data includes:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Account information (name, email, institution)</li>
                        <li>Submitted solutions and evaluation results</li>
                        <li>Platform activity (page views, comments)</li>
                        <li>Technical data (IP address, browser, device)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Competitions and Events</h2>
                    <h3 className="text-xl font-semibold mb-3">8.1 Specific Rules</h3>
                    <p className="mb-4">
                        Each competition may have additional specific rules that will be
                        communicated to participants before the competition begins.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">8.2 Disqualification</h3>
                    <p className="mb-4">Participants may be disqualified for:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Violating competition rules</li>
                        <li>Unauthorized collaboration with other participants</li>
                        <li>Using prohibited external resources</li>
                        <li>Unsportsmanlike conduct</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                    <p className="mb-4">
                        The Platform is provided "as is" without warranties of any kind. We do not
                        guarantee:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Continuous availability of the Platform</li>
                        <li>Absence of errors or interruptions</li>
                        <li>Absolute accuracy of evaluations</li>
                        <li>Complete security against attacks</li>
                    </ul>
                    <p className="mb-4">We are not responsible for:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Loss of data or scores due to technical causes</li>
                        <li>Indirect damages or consequences of Platform use</li>
                        <li>User-generated content</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        10. Account Suspension and Closure
                    </h2>
                    <p className="mb-4">
                        We reserve the right to suspend or close your account if:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>You violate these Terms and Conditions</li>
                        <li>You provide false or misleading information</li>
                        <li>You use the Platform abusively</li>
                        <li>Your account is inactive for an extended period</li>
                    </ul>
                    <p className="mb-4">
                        You may request deletion of your account at any time by contacting our
                        support team.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                    <p className="mb-4">
                        We reserve the right to modify these Terms and Conditions at any time.
                        Changes will be communicated through:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Platform notification</li>
                        <li>Email to registered users</li>
                        <li>Updating the "Last updated" date</li>
                    </ul>
                    <p className="mb-4">
                        Continued use of the Platform after changes constitutes acceptance of the
                        new terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
                    <p className="mb-4">
                        These Terms and Conditions are governed by Romanian law. Any disputes will
                        be resolved by the competent courts in Romania.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
                    <p className="mb-4">
                        For questions or concerns regarding these Terms and Conditions, you can
                        contact us at:
                    </p>
                    <ul className="list-none pl-0 mb-4 space-y-2">
                        <li>
                            <strong>Email:</strong>{' '}
                            <a
                                href="mailto:contact@olimpiada-ai.ro"
                                className="text-primary hover:underline"
                            >
                                contact@olimpiada-ai.ro
                            </a>
                        </li>
                        <li>
                            <strong>Website:</strong>{' '}
                            <a
                                href="https://olimpiada-ai.ro"
                                className="text-primary hover:underline"
                            >
                                https://olimpiada-ai.ro
                            </a>
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Final Provisions</h2>
                    <p className="mb-4">
                        If any provision of these Terms and Conditions is deemed invalid or
                        unenforceable, the remaining provisions remain in effect.
                    </p>
                    <p className="mb-4">
                        Failure to exercise a right or provision of these terms does not constitute
                        a waiver of that right or provision.
                    </p>
                </section>

                <div className="mt-12 p-6 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        By using the National AI Olympiad Platform, you confirm that you have read,
                        understood, and accepted these Terms and Conditions in their entirety.
                    </p>
                </div>
            </div>
        </div>
    );
}
