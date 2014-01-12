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

private:
    Ui::NListDialog *ui;

protected slots:
    void filterTextList(const QString &text);
};

#endif // N_LIST_DIALOG_H
