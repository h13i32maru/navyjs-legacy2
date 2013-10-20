#ifndef N_FILE_OPENER_H
#define N_FILE_OPENER_H

#include <QDialog>

namespace Ui {
class NFileOpener;
}

class NFileOpener : public QDialog
{
    Q_OBJECT

public:
    explicit NFileOpener(QWidget *parent = 0);
    QString filePath() const;
    ~NFileOpener();

protected:
    virtual void keyPressEvent(QKeyEvent *event);

private:
    Ui::NFileOpener *ui;

private slots:
    void decideFilePath(const QString &filePath);
};

#endif // N_FILE_OPENER_H
