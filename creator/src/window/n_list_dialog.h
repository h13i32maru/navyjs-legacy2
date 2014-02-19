#ifndef N_LIST_DIALOG_H
#define N_LIST_DIALOG_H

#include <QDialog>

namespace Ui {
class NListDialog;
}

class NListDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NListDialog(QWidget *parent = 0);
    ~NListDialog();
    void setTextList(const QStringList &list);
    void setCurrentText(const QString &text);
    QString selectedText();
    void setAllowEmpty(bool allow);

private:
    Ui::NListDialog *ui;
    bool mEmpty;
    bool mAllowEmpty;

protected slots:
    void filterTextList(const QString &text);
    void acceptEmpty();
};

#endif // N_LIST_DIALOG_H
