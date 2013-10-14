#ifndef N_BUILD_ERROR_DIALOG_H
#define N_BUILD_ERROR_DIALOG_H

#include <QDialog>

namespace Ui {
class NBuildErrorDialog;
}

class NBuildErrorDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NBuildErrorDialog(QWidget *parent = 0);
    void setError(const QStringList &errorList);
    ~NBuildErrorDialog();

private:
    Ui::NBuildErrorDialog *ui;
};

#endif // N_BUILD_ERROR_DIALOG_H
