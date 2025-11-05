export const testController = async (_req, res) => {
    try {
        res.status(200).json({
            message: "Aurikrex backend is working perfectly! 🚀",
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
};
//# sourceMappingURL=testController.js.map